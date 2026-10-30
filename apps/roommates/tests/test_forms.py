"""
Unit tests for RoommatePreferenceForm validating 7 lifestyle factors, bounds, completeness,
and strict zero-smoking enforcement.
"""
import datetime
import pytest
from django.contrib.auth import get_user_model
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
from apps.roommates.models import RoommatePreference, FoodPreference
from apps.roommates.forms import RoommatePreferenceForm

User = get_user_model()


@pytest.mark.django_db
class TestRoommatePreferenceForm:
    """Test suite for 7-factor RoommatePreferenceForm."""

    @pytest.fixture
    def student_profile(self):
        """Fixture creating a verified student profile."""
        univ = University.objects.create(name='LPU Punjab', code='LPU-PBI')
        dept = Department.objects.create(university=univ, name='Computer Applications', code='CA')
        prog = DegreeProgram.objects.create(department=dept, name='BCA', duration_years=3)
        branch = Branch.objects.create(program=prog, name='BCA Core', code='BCAC')
        batch = AdmissionBatch.objects.create(program=prog, year=2024)

        registry = StudentRegistry.objects.create(
            student_id='2024BCA101',
            full_name='Test Candidate',
            institutional_email='candidate@lpu.in',
            gender=Gender.MALE,
            date_of_birth=datetime.date(2005, 5, 10),
            branch=branch,
            batch=batch,
        )
        user = User.objects.create_user(
            email='candidate@lpu.in',
            password='TestPassword123!',
            student_id_login='2024BCA101'
        )
        return StudentProfile.objects.create(user=user, registry=registry)

    def test_valid_complete_form(self, student_profile):
        """Rule 12: Complete 7-factor valid submission succeeds and saves."""
        data = {
            'sleeping_schedule': 3,
            'cleanliness': 4,
            'study_habits': 2,
            'noise_tolerance': 3,
            'food_preference': FoodPreference.VEGETARIAN,
            'social_preference': 3,
            'temperature_pref': 4,
        }
        form = RoommatePreferenceForm(data=data)
        assert form.is_valid(), form.errors

        pref = form.save(student=student_profile)
        assert pref.pk is not None
        assert pref.student == student_profile
        assert pref.sleeping_schedule == 3
        assert pref.cleanliness == 4
        assert pref.food_preference == FoodPreference.VEGETARIAN

    def test_missing_fields_rejected(self):
        """Enforces 100% completion - no partial questionnaire submission."""
        data = {
            'sleeping_schedule': 3,
            'cleanliness': 4,
            # study_habits missing
            'noise_tolerance': 3,
            'food_preference': FoodPreference.FLEXIBLE,
            # social_preference missing
            'temperature_pref': 4,
        }
        form = RoommatePreferenceForm(data=data)
        assert not form.is_valid()
        assert 'study_habits' in form.errors
        assert 'social_preference' in form.errors

    def test_out_of_bounds_scale_rejected(self):
        """Scale values must strictly be integers between 1 and 5."""
        data = {
            'sleeping_schedule': 6,  # Invalid: > 5
            'cleanliness': 0,        # Invalid: < 1
            'study_habits': 3,
            'noise_tolerance': 3,
            'food_preference': FoodPreference.NON_VEGETARIAN,
            'social_preference': 3,
            'temperature_pref': 4,
        }
        form = RoommatePreferenceForm(data=data)
        assert not form.is_valid()
        assert 'sleeping_schedule' in form.errors
        assert 'cleanliness' in form.errors

    def test_invalid_food_preference_rejected(self):
        """Dietary choice must be within FoodPreference choices."""
        data = {
            'sleeping_schedule': 3,
            'cleanliness': 3,
            'study_habits': 3,
            'noise_tolerance': 3,
            'food_preference': 'PESCATARIAN',  # Invalid choice
            'social_preference': 3,
            'temperature_pref': 3,
        }
        form = RoommatePreferenceForm(data=data)
        assert not form.is_valid()
        assert 'food_preference' in form.errors

    def test_strict_zero_smoking_enforcement(self):
        """Smoking preferences must be strictly barred from the system."""
        data = {
            'sleeping_schedule': 3,
            'cleanliness': 3,
            'study_habits': 3,
            'noise_tolerance': 3,
            'food_preference': FoodPreference.FLEXIBLE,
            'social_preference': 3,
            'temperature_pref': 3,
            'smoking': 'NO',  # Injected smoking parameter
        }
        form = RoommatePreferenceForm(data=data)
        assert not form.is_valid()
        assert any('smoking' in err.lower() or 'smoke' in err.lower() for err in form.non_field_errors())

