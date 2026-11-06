"""
Applications Views: Student multi-priority application submission, status timeline, and review queue.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View

from apps.accounts.decorators import student_required, warden_required
from apps.hostels.services.scoping import get_warden_assigned_hostel_ids
from .models import HostelApplication, ApplicationStatus
from .forms import ApplicationSubmissionForm, ApplicationReviewForm
from .services.eligibility import get_active_cycle, check_student_eligibility
from .services.submission import update_application_status


@method_decorator([login_required, student_required], name='dispatch')
class ApplyView(View):
    """View allowing enrolled students to submit up to 3 prioritized hostel choices."""
    template_name = 'applications/apply.html'

    def get(self, request):
        cycle = get_active_cycle()
        if not cycle:
            messages.warning(request, 'There is currently no open accommodation intake cycle.')
            return redirect('accounts:student_placeholder')

        student = request.user.student_profile
        eligible, reason = check_student_eligibility(student, cycle)

        if not eligible:
            # If student already applied, redirect to view their application
            existing_app = HostelApplication.objects.filter(student=student, cycle=cycle).first()
            if existing_app:
                messages.info(request, reason)
                return redirect('applications:detail', pk=existing_app.id)

            messages.error(request, reason)
            return redirect('accounts:student_placeholder')

        form = ApplicationSubmissionForm(student=student, cycle=cycle)
        return render(request, self.template_name, {
            'form': form,
            'cycle': cycle,
            'student': student,
        })

    def post(self, request):
        cycle = get_active_cycle()
        if not cycle:
            messages.error(request, 'Intake cycle is closed.')
            return redirect('accounts:student_placeholder')

        student = request.user.student_profile
        form = ApplicationSubmissionForm(student=student, cycle=cycle, data=request.POST)

        if form.is_valid():
            try:
                application = form.save()
                messages.success(request, f'Application #{application.id} submitted successfully!')
                return redirect('applications:detail', pk=application.id)
            except ValidationError as e:
                form.add_error(None, e.message if hasattr(e, 'message') else str(e))

        return render(request, self.template_name, {
            'form': form,
            'cycle': cycle,
            'student': student,
        })


@method_decorator(login_required, name='dispatch')
class ApplicationDetailView(View):
    """View displaying application details, choices, and status history timeline."""
    template_name = 'applications/application_detail.html'

    def get(self, request, pk):
        application = get_object_or_404(
            HostelApplication.objects.select_related('student__registry', 'cycle').prefetch_related(
                'choices__hostel',
                'choices__room',
                'status_history__changed_by'
            ),
            pk=pk
        )

        user = request.user
        # Authorization check: student can only view their own application
        if user.is_student and application.student.user_id != user.id:
            raise PermissionDenied("You do not have permission to view this application.")

        review_form = ApplicationReviewForm(initial={'status': application.status}) if (user.is_admin or user.is_warden) else None

        return render(request, self.template_name, {
            'application': application,
            'choices': application.choices.all().order_by('priority'),
            'history': application.status_history.all().order_by('-changed_at'),
            'review_form': review_form,
        })


@method_decorator([login_required, warden_required], name='dispatch')
class ApplicationReviewQueueView(View):
    """Administrative and Warden queue to inspect and manage applicant choices."""
    template_name = 'applications/review_queue.html'

    def get(self, request):
        user = request.user
        active_cycle = get_active_cycle()

        queryset = HostelApplication.objects.select_related(
            'student__registry',
            'cycle'
        ).prefetch_related(
            'choices__hostel'
        ).order_by('-submitted_at')

        if active_cycle:
            queryset = queryset.filter(cycle=active_cycle)

        # Scoping: If user is Warden, filter to applications requesting their assigned hostels
        if user.is_warden and not user.is_admin:
            assigned_hostel_ids = get_warden_assigned_hostel_ids(user)
            queryset = queryset.filter(choices__hostel_id__in=assigned_hostel_ids).distinct()

        # Filter by status if provided in query params
        status_filter = request.GET.get('status')
        if status_filter in ApplicationStatus.values:
            queryset = queryset.filter(status=status_filter)

        return render(request, self.template_name, {
            'applications': queryset,
            'active_cycle': active_cycle,
            'status_choices': ApplicationStatus.choices,
            'current_status': status_filter,
        })


@method_decorator([login_required, warden_required], name='dispatch')
class ApplicationReviewActionView(View):
    """Processes decision status changes made by Admins or Wardens."""
    def post(self, request, pk):
        application = get_object_or_404(HostelApplication, pk=pk)
        form = ApplicationReviewForm(request.POST)

        if form.is_valid():
            new_status = form.cleaned_data['status']
            notes = form.cleaned_data['notes']
            update_application_status(
                application=application,
                new_status=new_status,
                changed_by=request.user,
                notes=notes
            )
            messages.success(request, f"Application #{application.id} updated to {application.get_status_display()}.")

        return redirect('applications:detail', pk=pk)
