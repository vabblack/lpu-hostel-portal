"""
Unit and integration tests for the pure Python deterministic compatibility algorithm.
Validates mathematical symmetry, 7-factor weights, boundary conditions (0% and 100%),
dietary logic, and MatchScore caching.
"""
from decimal import Decimal
import datetime
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.academics.models import (
    University,
    Department,
    DegreeProgram,
    Branch,
    AdmissionBatch,
    StudentRegistry,
    Gender,
)
from apps.students.models import StudentProfile
from apps.roommates.models import RoommatePreference, FoodPreference, MatchScore
from apps.roommates.services.algorithm import (
    calculate_pair_similarity,
    get_or_compute_match_score,
    WEIGHT_SLEEP,
    WEIGHT_CLEANLINESS,
    WEIGHT_STUDY,
    WEIGHT_NOISE,
    WEIGHT_FOOD,
    WEIGHT_SOCIAL,
    WEIGHT_TEMPERATURE,
    TOTAL_WEIGHT,
)

User = get_user_model()


@pytest.mark.django_db
class TestCompatibilityAlgorithm:
    """Test suite for deterministic compatibility algorithm."""

    @pytest.fixture
    def students_setup(self):
        """Create test students and academic hierarchy."""
        univ = University.objects.create(name='LPU University', code='LPU-ALGO')
        dept = Department.objects.create(university=univ, name='Dept of CS', code='CS')
        prog = DegreeProgram.objects.create(department=dept, name='B.Tech', duration_years=4)
        branch = Branch.objects.create(program=prog, name='CSE', code='CSE')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        reg1 = StudentRegistry.objects.create(
            student_id='ALGO001', full_name='Student One', institutional_email='one@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 1, 1), branch=branch, batch=batch
        )
        reg2 = StudentRegistry.objects.create(
            student_id='ALGO002', full_name='Student Two', institutional_email='two@lpu.in',
            gender=Gender.MALE, date_of_birth=datetime.date(2004, 2, 2), branch=branch, batch=batch
        )
        user1 = User.objects.create_user(email='one@lpu.in', password='Password123!', student_id_login='ALGO001')
        user2 = User.objects.create_user(email='two@lpu.in', password='Password123!', student_id_login='ALGO002')

        s1 = StudentProfile.objects.create(user=user1, registry=reg1)
        s2 = StudentProfile.objects.create(user=user2, registry=reg2)
        return {'s1': s1, 's2': s2}

    def test_weights_sum_to_exact_unity(self):
        """Rule 12: Seven factor weights must sum to exactly 1.00."""
        assert TOTAL_WEIGHT == Decimal('1.00')
        assert WEIGHT_SLEEP == Decimal('0.22')
        assert WEIGHT_CLEANLINESS == Decimal('0.17')
        assert WEIGHT_STUDY == Decimal('0.17')
        assert WEIGHT_NOISE == Decimal('0.11')
        assert WEIGHT_FOOD == Decimal('0.11')
        assert WEIGHT_SOCIAL == Decimal('0.11')
        assert WEIGHT_TEMPERATURE == Decimal('0.11')

    def test_identical_profiles_yield_hundred_percent(self, students_setup):
        """Two students with identical lifestyle answers must yield exactly 100.00%."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        pref1 = RoommatePreference.objects.create(
            student=s1, sleeping_schedule=3, cleanliness=4, study_habits=2,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=4
        )
        pref2 = RoommatePreference.objects.create(
            student=s2, sleeping_schedule=3, cleanliness=4, study_habits=2,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=4
        )

        score = calculate_pair_similarity(pref1, pref2)
        assert score == Decimal('100.00')

    def test_polar_opposite_profiles_yield_zero_percent(self, students_setup):
        """Two students with maximum differences in all factors must yield exactly 0.00%."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        pref1 = RoommatePreference.objects.create(
            student=s1, sleeping_schedule=1, cleanliness=1, study_habits=1,
            noise_tolerance=1, food_preference=FoodPreference.VEGETARIAN,
            social_preference=1, temperature_pref=1
        )
        pref2 = RoommatePreference.objects.create(
            student=s2, sleeping_schedule=5, cleanliness=5, study_habits=5,
            noise_tolerance=5, food_preference=FoodPreference.NON_VEGETARIAN,
            social_preference=5, temperature_pref=5
        )

        score = calculate_pair_similarity(pref1, pref2)
        assert score == Decimal('0.00')

    def test_mathematical_symmetry(self, students_setup):
        """Symmetry guarantee: Score(A, B) == Score(B, A)."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        pref1 = RoommatePreference.objects.create(
            student=s1, sleeping_schedule=2, cleanliness=5, study_habits=1,
            noise_tolerance=4, food_preference=FoodPreference.FLEXIBLE,
            social_preference=2, temperature_pref=5
        )
        pref2 = RoommatePreference.objects.create(
            student=s2, sleeping_schedule=4, cleanliness=2, study_habits=3,
            noise_tolerance=1, food_preference=FoodPreference.VEGETARIAN,
            social_preference=4, temperature_pref=2
        )

        score_12 = calculate_pair_similarity(pref1, pref2)
        score_21 = calculate_pair_similarity(pref2, pref1)
        assert score_12 == score_21

        cached_12 = get_or_compute_match_score(s1, s2)
        cached_21 = get_or_compute_match_score(s2, s1)
        assert cached_12 == cached_21
        assert cached_12 == score_12

    def test_dietary_flexible_partial_score(self, students_setup):
        """Flexible diet yields 80% on the dietary dimension."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        # All ordinal factors identical (diff = 0)
        pref1 = RoommatePreference.objects.create(
            student=s1, sleeping_schedule=3, cleanliness=3, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=3
        )
        pref2 = RoommatePreference.objects.create(
            student=s2, sleeping_schedule=3, cleanliness=3, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.FLEXIBLE,
            social_preference=3, temperature_pref=3
        )

        # 89% from non-diet factors + (0.11 * 0.8 * 100 = 8.8%) = 97.80%
        score = calculate_pair_similarity(pref1, pref2)
        assert score == Decimal('97.80')

    def test_missing_preference_returns_none(self, students_setup):
        """If a student has not filled preferences, get_or_compute_match_score returns None."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        # s1 has preferences, s2 does not
        RoommatePreference.objects.create(
            student=s1, sleeping_schedule=3, cleanliness=3, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=3
        )

        score = get_or_compute_match_score(s1, s2)
        assert score is None

    def test_score_caching_and_canonical_pair(self, students_setup):
        """Verify score is saved in MatchScore with canonical key ordering."""
        s1 = students_setup['s1']
        s2 = students_setup['s2']

        RoommatePreference.objects.create(
            student=s1, sleeping_schedule=3, cleanliness=3, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=3
        )
        RoommatePreference.objects.create(
            student=s2, sleeping_schedule=3, cleanliness=3, study_habits=3,
            noise_tolerance=3, food_preference=FoodPreference.VEGETARIAN,
            social_preference=3, temperature_pref=3
        )

        score = get_or_compute_match_score(s1, s2)
        assert score == Decimal('100.00')

        # Assert exactly one MatchScore row exists
        assert MatchScore.objects.count() == 1
        entry = MatchScore.objects.first()
        assert entry.student_a == min(s1, s2, key=lambda s: s.pk)
        assert entry.student_b == max(s1, s2, key=lambda s: s.pk)
        assert entry.score == Decimal('100.00')

