"""
Management command to seed realistic demonstration and development data.
Generates universities, degree programs, student registry, user accounts,
hostel buildings, rooms, beds, roommate preferences, applications, and allocations.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import Role
from apps.academics.models import (
    University, Department, DegreeProgram, Branch,
    AdmissionBatch, StudentRegistry, Gender, EnrollmentStatus
)
from apps.students.models import StudentProfile
from apps.hostels.models import (
    Hostel, Block, Floor, Room, Bed, BedStatus,
    GenderPolicy, HostelStatus, WashroomType,
    Facility, RoomFacility, WardenAssignment
)
from apps.applications.models import (
    AccommodationCycle, HostelApplication, ApplicationStatus,
    ApplicationChoice, ApplicationStatusHistory
)
from apps.roommates.models import RoommatePreference, FoodPreference
from apps.allocations.models import Allocation
from apps.notifications.models import Notification, NotificationType

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds database with comprehensive university hostel demo data.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding comprehensive demo data for Hostel Allocation System..."))

        # 1. Academics
        univ, _ = University.objects.get_or_create(
            code='LPU',
            defaults={'name': 'Lovely Professional University'}
        )

        dept_eng, _ = Department.objects.get_or_create(
            university=univ, code='ENG',
            defaults={'name': 'School of Computer Science & Engineering'}
        )
        dept_bio, _ = Department.objects.get_or_create(
            university=univ, code='BIO',
            defaults={'name': 'School of Bioengineering & Biosciences'}
        )
        dept_mgt, _ = Department.objects.get_or_create(
            university=univ, code='MGT',
            defaults={'name': 'Mittal School of Business'}
        )

        prog_btech, _ = DegreeProgram.objects.get_or_create(
            department=dept_eng, name='B.Tech CSE', defaults={'duration_years': 4}
        )
        prog_biot, _ = DegreeProgram.objects.get_or_create(
            department=dept_bio, name='B.Tech Biotechnology', defaults={'duration_years': 4}
        )
        prog_mba, _ = DegreeProgram.objects.get_or_create(
            department=dept_mgt, name='MBA', defaults={'duration_years': 2}
        )

        branch_cse, _ = Branch.objects.get_or_create(program=prog_btech, code='CSE', defaults={'name': 'Computer Science'})
        branch_ai, _ = Branch.objects.get_or_create(program=prog_btech, code='AI', defaults={'name': 'Artificial Intelligence'})
        branch_bt, _ = Branch.objects.get_or_create(program=prog_biot, code='BT', defaults={'name': 'Biotechnology'})
        branch_mkt, _ = Branch.objects.get_or_create(program=prog_mba, code='MKT', defaults={'name': 'Marketing'})

        batch_2024, _ = AdmissionBatch.objects.get_or_create(program=prog_btech, year=2024)
        batch_2025, _ = AdmissionBatch.objects.get_or_create(program=prog_btech, year=2025)

        # 2. Accommodation Cycle
        cycle, _ = AccommodationCycle.objects.get_or_create(
            academic_year='2026-2027', semester=1,
            defaults={
                'name': 'Academic Year 2026-27 (Fall Semester)',
                'application_start': timezone.now() - datetime.timedelta(days=7),
                'application_end': timezone.now() + datetime.timedelta(days=30),
                'is_active': True
            }
        )

        # 3. Facilities
        fac_wifi, _ = Facility.objects.get_or_create(name='High-Speed Wi-Fi', defaults={'description': 'High-speed wireless internet connection.'})
        fac_ac, _ = Facility.objects.get_or_create(name='Air Conditioning', defaults={'description': 'Climate-controlled air conditioning.'})
        fac_balcony, _ = Facility.objects.get_or_create(name='Private Balcony', defaults={'description': 'Outdoor balcony with campus view.'})
        fac_geyser, _ = Facility.objects.get_or_create(name='Geyser / Hot Water', defaults={'description': 'Instant hot water heating unit.'})

        # 4. Hostels
        h1, _ = Hostel.objects.get_or_create(
            code='BH-1',
            defaults={
                'university': univ,
                'name': 'Shivalik Boys Hostel (BH-1)',
                'gender_policy': GenderPolicy.MALE,
                'status': HostelStatus.ACTIVE,
                'total_capacity': 120,
                'description': 'Premier multi-storey residential tower for male undergraduate scholars featuring air-conditioned suites and recreational amenities.'
            }
        )

        h2, _ = Hostel.objects.get_or_create(
            code='BH-2',
            defaults={
                'university': univ,
                'name': 'Himalaya Boys Hostel (BH-2)',
                'gender_policy': GenderPolicy.MALE,
                'status': HostelStatus.ACTIVE,
                'total_capacity': 80,
                'description': 'Quiet academic residence with spacious rooms, attached washrooms, and high-speed fiber optic connectivity.'
            }
        )

        h3, _ = Hostel.objects.get_or_create(
            code='GH-1',
            defaults={
                'university': univ,
                'name': 'Nilgiri Girls Hostel (GH-1)',
                'gender_policy': GenderPolicy.FEMALE,
                'status': HostelStatus.ACTIVE,
                'total_capacity': 100,
                'description': 'Modern, secure residential facility with 24x7 security, biometric access, fitness gym, and indoor recreation halls.'
            }
        )

        # Populate rooms and beds for BH-1
        for block_name in ['Block A', 'Block B']:
            block, _ = Block.objects.get_or_create(hostel=h1, name=block_name)
            for floor_num in [1, 2]:
                floor, _ = Floor.objects.get_or_create(block=block, floor_number=floor_num)
                for r_num in [1, 2, 3]:
                    room_number = f"{floor_num}0{r_num}"
                    room, _ = Room.objects.get_or_create(
                        floor=floor,
                        room_number=room_number,
                        defaults={
                            'capacity': 2 if r_num % 2 == 1 else 3,
                            'washroom_type': WashroomType.ATTACHED,
                            'is_air_conditioned': True
                        }
                    )
                    for fac in [fac_wifi, fac_ac, fac_geyser]:
                        RoomFacility.objects.get_or_create(room=room, facility=fac)
                    # Generate beds
                    bed_count = room.capacity
                    for b_idx in range(bed_count):
                        b_ident = chr(ord('A') + b_idx)
                        Bed.objects.get_or_create(
                            room=room,
                            bed_identifier=b_ident,
                            defaults={'status': BedStatus.VACANT}
                        )

        # Populate rooms and beds for GH-1
        for block_name in ['Wing Alpha', 'Wing Beta']:
            block, _ = Block.objects.get_or_create(hostel=h3, name=block_name)
            for floor_num in [1, 2]:
                floor, _ = Floor.objects.get_or_create(block=block, floor_number=floor_num)
                for r_num in [1, 2]:
                    room_number = f"G-{floor_num}0{r_num}"
                    room, _ = Room.objects.get_or_create(
                        floor=floor,
                        room_number=room_number,
                        defaults={
                            'capacity': 2,
                            'washroom_type': WashroomType.ATTACHED,
                            'is_air_conditioned': True
                        }
                    )
                    for fac in [fac_wifi, fac_ac, fac_balcony, fac_geyser]:
                        RoomFacility.objects.get_or_create(room=room, facility=fac)
                    for b_idx in range(2):
                        b_ident = chr(ord('A') + b_idx)
                        Bed.objects.get_or_create(
                            room=room,
                            bed_identifier=b_ident,
                            defaults={'status': BedStatus.VACANT}
                        )

        # 5. Core Administrative Accounts
        admin_user, created = User.objects.get_or_create(
            email='admin@lpu.in',
            defaults={
                'role': Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Password123!')
            admin_user.save()

        warden_boys, created = User.objects.get_or_create(
            email='warden.boys@lpu.in',
            defaults={
                'role': Role.WARDEN,
                'is_staff': False,
            }
        )
        if created:
            warden_boys.set_password('Password123!')
            warden_boys.save()

        WardenAssignment.objects.get_or_create(
            user=warden_boys,
            hostel=h1,
            defaults={'can_approve_allocation': True, 'is_active': True}
        )
        WardenAssignment.objects.get_or_create(
            user=warden_boys,
            hostel=h2,
            defaults={'can_approve_allocation': True, 'is_active': True}
        )

        warden_girls, created = User.objects.get_or_create(
            email='warden.girls@lpu.in',
            defaults={
                'role': Role.WARDEN,
                'is_staff': False,
            }
        )
        if created:
            warden_girls.set_password('Password123!')
            warden_girls.save()

        WardenAssignment.objects.get_or_create(
            user=warden_girls,
            hostel=h3,
            defaults={'can_approve_allocation': True, 'is_active': True}
        )

        # 6. Student Accounts & Profiles
        students_data = [
            # Male students
            {
                'email': 'arjun.sharma@lpu.in',
                'id': '12400001',
                'name': 'Arjun Sharma',
                'gender': Gender.MALE,
                'branch': branch_cse,
                'pref': {'sleep': 1, 'clean': 4, 'study': 2, 'noise': 2, 'food': FoodPreference.VEGETARIAN, 'social': 3, 'temp': 3}
            },
            {
                'email': 'rohit.verma@lpu.in',
                'id': '12400002',
                'name': 'Rohit Verma',
                'gender': Gender.MALE,
                'branch': branch_cse,
                'pref': {'sleep': 2, 'clean': 4, 'study': 2, 'noise': 2, 'food': FoodPreference.VEGETARIAN, 'social': 3, 'temp': 3}
            },
            {
                'email': 'vikram.singh@lpu.in',
                'id': '12400003',
                'name': 'Vikram Singh',
                'gender': Gender.MALE,
                'branch': branch_ai,
                'pref': {'sleep': 4, 'clean': 2, 'study': 4, 'noise': 4, 'food': FoodPreference.NON_VEGETARIAN, 'social': 5, 'temp': 5}
            },
            {
                'email': 'aman.gupta@lpu.in',
                'id': '12400004',
                'name': 'Aman Gupta',
                'gender': Gender.MALE,
                'branch': branch_bt,
                'pref': {'sleep': 3, 'clean': 3, 'study': 3, 'noise': 3, 'food': FoodPreference.FLEXIBLE, 'social': 3, 'temp': 3}
            },
            # Female students
            {
                'email': 'priya.patel@lpu.in',
                'id': '12400005',
                'name': 'Priya Patel',
                'gender': Gender.FEMALE,
                'branch': branch_cse,
                'pref': {'sleep': 2, 'clean': 5, 'study': 1, 'noise': 1, 'food': FoodPreference.VEGETARIAN, 'social': 2, 'temp': 3}
            },
            {
                'email': 'ananya.sen@lpu.in',
                'id': '12400006',
                'name': 'Ananya Sen',
                'gender': Gender.FEMALE,
                'branch': branch_ai,
                'pref': {'sleep': 2, 'clean': 5, 'study': 2, 'noise': 1, 'food': FoodPreference.FLEXIBLE, 'social': 2, 'temp': 3}
            },
        ]

        created_students = []
        for s in students_data:
            reg, _ = StudentRegistry.objects.get_or_create(
                student_id=s['id'],
                defaults={
                    'full_name': s['name'],
                    'institutional_email': s['email'],
                    'gender': s['gender'],
                    'date_of_birth': datetime.date(2004, 1, 1),
                    'branch': s['branch'],
                    'batch': batch_2024,
                    'enrollment_status': EnrollmentStatus.ACTIVE
                }
            )

            u, u_created = User.objects.get_or_create(
                email=s['email'],
                defaults={
                    'role': Role.STUDENT,
                    'student_id_login': s['id']
                }
            )
            if u_created:
                u.set_password('Password123!')
                u.save()

            prof, _ = StudentProfile.objects.get_or_create(
                user=u,
                defaults={
                    'registry': reg,
                    'emergency_contact_name': 'Parent / Guardian',
                    'emergency_contact_phone': '+91-9876543210'
                }
            )
            created_students.append(prof)

            # Roommate preferences (Strictly zero smoking)
            p = s['pref']
            RoommatePreference.objects.update_or_create(
                student=prof,
                defaults={
                    'sleeping_schedule': p['sleep'],
                    'cleanliness': p['clean'],
                    'study_habits': p['study'],
                    'noise_tolerance': p['noise'],
                    'food_preference': p['food'],
                    'social_preference': p['social'],
                    'temperature_pref': p['temp']
                }
            )

        # 7. Sample Applications & Allocations
        # Arjun & Rohit apply for BH-1 Room 101
        bh1_room101 = Room.objects.filter(floor__block__hostel=h1, room_number='101').first()
        if bh1_room101:
            arjun = created_students[0]
            rohit = created_students[1]

            # Application for Arjun (Allocated)
            app_arjun, _ = HostelApplication.objects.get_or_create(
                student=arjun, cycle=cycle,
                defaults={'status': ApplicationStatus.ALLOCATED}
            )
            ApplicationChoice.objects.get_or_create(
                application=app_arjun, priority=1,
                defaults={'hostel': h1, 'room': bh1_room101}
            )

            # Bed allocation for Arjun
            bed_a = bh1_room101.beds.filter(bed_identifier='A').first()
            if bed_a:
                bed_a.status = BedStatus.OCCUPIED
                bed_a.save()
                Allocation.objects.get_or_create(
                    bed=bed_a,
                    defaults={
                        'student': arjun,
                        'application': app_arjun,
                        'cycle': cycle,
                        'allocated_by': admin_user,
                        'start_date': datetime.date(2026, 8, 1),
                        'end_date': datetime.date(2027, 5, 31),
                        'is_active': True
                    }
                )

            # Application for Rohit (Approved, awaiting allocation)
            app_rohit, _ = HostelApplication.objects.get_or_create(
                student=rohit, cycle=cycle,
                defaults={'status': ApplicationStatus.APPROVED}
            )
            ApplicationChoice.objects.get_or_create(
                application=app_rohit, priority=1,
                defaults={'hostel': h1, 'room': bh1_room101}
            )

        # Girls application for Priya (Submitted)
        gh1_room = Room.objects.filter(floor__block__hostel=h3).first()
        if gh1_room:
            priya = created_students[4]
            app_priya, _ = HostelApplication.objects.get_or_create(
                student=priya, cycle=cycle,
                defaults={'status': ApplicationStatus.SUBMITTED}
            )
            ApplicationChoice.objects.get_or_create(
                application=app_priya, priority=1,
                defaults={'hostel': h3, 'room': gh1_room}
            )

        # 8. Notifications
        for s in created_students:
            Notification.objects.get_or_create(
                recipient=s.user,
                title="Welcome to LPU Hostel Portal",
                defaults={
                    'message': "Welcome to the accommodation management portal. You can submit lifestyle preferences, explore hostels, and request compatible roommates.",
                    'notification_type': NotificationType.SYSTEM,
                    'is_read': False
                }
            )

        self.stdout.write(self.style.SUCCESS("Demo data successfully seeded!"))
        self.stdout.write(self.style.SUCCESS("Available login accounts (Password: Password123!):"))
        self.stdout.write("  Admin:   admin@lpu.in")
        self.stdout.write("  Warden:  warden.boys@lpu.in, warden.girls@lpu.in")
        self.stdout.write("  Student: arjun.sharma@lpu.in (ID: 12400001)")
        self.stdout.write("           rohit.verma@lpu.in  (ID: 12400002)")
        self.stdout.write("           priya.patel@lpu.in  (ID: 12400005)")
