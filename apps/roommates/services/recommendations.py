"""
Roommate Candidate Recommendation Service.
Filters same-gender students, evaluates compatibility scores, detects room alignment,
and ranks recommendations descending by match score.
"""
from typing import List, Dict, Any
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from apps.students.models import StudentProfile
from apps.applications.models import AccommodationCycle
from apps.roommates.models import RoommatePreference, RoommateGroupMember
from apps.roommates.services.algorithm import get_or_compute_match_score
from apps.roommates.services.requests import get_student_selected_room


def get_roommate_recommendations(
    student: StudentProfile,
    cycle: AccommodationCycle,
    min_score: float = 0.0,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Find top recommended roommates for a student in an accommodation cycle:
    - Scoped strictly to the same verified gender.
    - Excludes self.
    - Excludes candidates already in a confirmed roommate group.
    - Ranks descending by deterministic compatibility score.
    """
    student_pref = getattr(student, 'roommate_preference', None)
    if not student_pref:
        student_pref = RoommatePreference.objects.filter(student=student).first()

    if not student_pref:
        return []

    # Exclude students in confirmed groups
    confirmed_student_ids = RoommateGroupMember.objects.filter(
        group__cycle=cycle,
        group__is_confirmed=True
    ).values_list('student_id', flat=True)

    # Scoped candidates pool
    candidates = StudentProfile.objects.filter(
        registry__gender=student.registry.gender,
        roommate_preference__isnull=False
    ).exclude(
        pk=student.pk
    ).exclude(
        pk__in=confirmed_student_ids
    ).select_related('registry', 'registry__branch', 'user', 'roommate_preference')

    student_room = get_student_selected_room(student, cycle)
    recommendations = []

    for candidate in candidates:
        candidate_pref = candidate.roommate_preference
        score = get_or_compute_match_score(student, candidate)
        if score is None or float(score) < min_score:
            continue

        candidate_room = get_student_selected_room(candidate, cycle)
        is_room_aligned = (
            student_room is not None and
            candidate_room is not None and
            student_room.pk == candidate_room.pk
        )

        # Compute lifestyle alignment highlights
        highlights = []
        if abs(student_pref.sleeping_schedule - candidate_pref.sleeping_schedule) == 0:
            highlights.append(_("Sleep Schedule Aligned"))
        elif abs(student_pref.sleeping_schedule - candidate_pref.sleeping_schedule) == 1:
            highlights.append(_("Similar Sleep Hours"))

        if abs(student_pref.cleanliness - candidate_pref.cleanliness) <= 1:
            highlights.append(_("Tidiness Compatible"))

        if abs(student_pref.study_habits - candidate_pref.study_habits) <= 1:
            highlights.append(_("Study Environment Compatible"))

        if student_pref.food_preference == candidate_pref.food_preference:
            highlights.append(_(f"Same Diet ({candidate_pref.get_food_preference_display()})"))
        elif 'FLEXIBLE' in [student_pref.food_preference, candidate_pref.food_preference]:
            highlights.append(_("Dietary Flexible"))

        if abs(student_pref.temperature_pref - candidate_pref.temperature_pref) <= 1:
            highlights.append(_("Room Temp Aligned"))

        recommendations.append({
            'student': candidate,
            'score': score,
            'is_room_aligned': is_room_aligned,
            'target_room': candidate_room,
            'highlights': highlights[:4],
        })

    # Sort descending by compatibility score
    recommendations.sort(key=lambda item: item['score'], reverse=True)
    return recommendations[:limit]

