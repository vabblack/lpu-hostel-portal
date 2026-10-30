"""
Deterministic, normalized roommate compatibility scoring algorithm in pure Python.
Strictly zero machine learning and zero external APIs.
Enforces mathematical symmetry, 7 weighted dimensions, and cached scoring.
"""
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from apps.students.models import StudentProfile
from apps.roommates.models import RoommatePreference, FoodPreference, MatchScore


# Seven lifestyle factor weights summing to exactly 1.00 (100%)
WEIGHT_SLEEP = Decimal('0.22')
WEIGHT_CLEANLINESS = Decimal('0.17')
WEIGHT_STUDY = Decimal('0.17')
WEIGHT_NOISE = Decimal('0.11')
WEIGHT_FOOD = Decimal('0.11')
WEIGHT_SOCIAL = Decimal('0.11')
WEIGHT_TEMPERATURE = Decimal('0.11')

TOTAL_WEIGHT = (
    WEIGHT_SLEEP + WEIGHT_CLEANLINESS + WEIGHT_STUDY +
    WEIGHT_NOISE + WEIGHT_FOOD + WEIGHT_SOCIAL + WEIGHT_TEMPERATURE
)
assert TOTAL_WEIGHT == Decimal('1.00'), f"Weights must sum to 1.00, got {TOTAL_WEIGHT}"


def ordinal_similarity(val_a: int, val_b: int) -> Decimal:
    """
    Normalized distance function for 1-5 ordinal scales:
    s_i = 1 - (|x_A - x_B| / 4)
    Guarantees s_i in [0.0, 1.0] and s_i(A, B) == s_i(B, A).
    """
    diff = abs(int(val_a) - int(val_b))
    similarity = Decimal('1.0') - (Decimal(diff) / Decimal('4.0'))
    return max(Decimal('0.0'), min(Decimal('1.0'), similarity))


def food_similarity(food_a: str, food_b: str) -> Decimal:
    """
    Categorical similarity for dietary preferences:
    - Identical diets: 1.0
    - Either is Flexible: 0.8
    - Opposing (Vegetarian vs Non-Vegetarian): 0.0
    Guarantees symmetry: food_similarity(A, B) == food_similarity(B, A).
    """
    if food_a == food_b:
        return Decimal('1.0')
    if food_a == FoodPreference.FLEXIBLE or food_b == FoodPreference.FLEXIBLE:
        return Decimal('0.8')
    return Decimal('0.0')


def calculate_pair_similarity(pref_a: RoommatePreference, pref_b: RoommatePreference) -> Decimal:
    """
    Calculate deterministic composite compatibility percentage between two students.
    Returns Decimal in [0.00, 100.00] rounded to 2 decimal places.
    """
    s_sleep = ordinal_similarity(pref_a.sleeping_schedule, pref_b.sleeping_schedule)
    s_clean = ordinal_similarity(pref_a.cleanliness, pref_b.cleanliness)
    s_study = ordinal_similarity(pref_a.study_habits, pref_b.study_habits)
    s_noise = ordinal_similarity(pref_a.noise_tolerance, pref_b.noise_tolerance)
    s_food = food_similarity(pref_a.food_preference, pref_b.food_preference)
    s_social = ordinal_similarity(pref_a.social_preference, pref_b.social_preference)
    s_temp = ordinal_similarity(pref_a.temperature_pref, pref_b.temperature_pref)

    composite = (
        (WEIGHT_SLEEP * s_sleep) +
        (WEIGHT_CLEANLINESS * s_clean) +
        (WEIGHT_STUDY * s_study) +
        (WEIGHT_NOISE * s_noise) +
        (WEIGHT_FOOD * s_food) +
        (WEIGHT_SOCIAL * s_social) +
        (WEIGHT_TEMPERATURE * s_temp)
    ) * Decimal('100.0')

    return composite.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def get_or_compute_match_score(
    student_a: StudentProfile,
    student_b: StudentProfile
) -> Decimal | None:
    """
    Retrieve cached compatibility score from MatchScore or compute on demand.
    Enforces canonical ordering (student_a.pk < student_b.pk).
    Returns None if either student has not submitted RoommatePreference.
    """
    if student_a.pk == student_b.pk:
        return Decimal('100.00')

    pref_a = getattr(student_a, 'roommate_preference', None)
    if pref_a is None:
        pref_a = RoommatePreference.objects.filter(student=student_a).first()

    pref_b = getattr(student_b, 'roommate_preference', None)
    if pref_b is None:
        pref_b = RoommatePreference.objects.filter(student=student_b).first()

    if not pref_a or not pref_b:
        return None

    # Canonical order by primary key
    if student_a.pk > student_b.pk:
        first_student, second_student = student_b, student_a
        first_pref, second_pref = pref_b, pref_a
    else:
        first_student, second_student = student_a, student_b
        first_pref, second_pref = pref_a, pref_b

    cached_match = MatchScore.objects.filter(
        student_a=first_student,
        student_b=second_student
    ).first()

    # If cached and fresh (calculated after both preferences were last updated)
    if cached_match:
        latest_pref_update = max(first_pref.updated_at, second_pref.updated_at)
        if cached_match.calculated_at >= latest_pref_update:
            return cached_match.score

    # Compute new score
    score = calculate_pair_similarity(first_pref, second_pref)

    match_obj, _ = MatchScore.objects.update_or_create(
        student_a=first_student,
        student_b=second_student,
        defaults={
            'score': score,
            'algorithm_version': 'v1.0',
        }
    )
    return match_obj.score

