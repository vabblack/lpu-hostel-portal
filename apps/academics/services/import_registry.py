"""
Academics Service: Safe bulk import of authoritative student registry from CSV files.
Performs row-level validation, foreign key resolution, and atomic batch loading.
"""
import csv
import datetime
import io
from typing import Dict, Any, Union
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction

from apps.academics.models import (
    Branch,
    AdmissionBatch,
    StudentRegistry,
    Gender,
    EnrollmentStatus,
)


def import_student_registry_from_csv(
    csv_file_or_content: Union[io.TextIOBase, str]
) -> Dict[str, Any]:
    """
    Parses and imports student registry records from a CSV file.

    Expected CSV header format:
    student_id,full_name,institutional_email,gender,date_of_birth,branch_code,batch_year,phone_number

    Returns:
        dict containing:
            - total_rows: int
            - created_count: int
            - skipped_count: int
            - errors: list of error strings
    """
    if isinstance(csv_file_or_content, str):
        stream = io.StringIO(csv_file_or_content.strip())
    else:
        stream = csv_file_or_content

    reader = csv.DictReader(stream)
    required_columns = {'student_id', 'full_name', 'institutional_email', 'gender', 'date_of_birth', 'branch_code', 'batch_year'}

    if not required_columns.issubset(set(col.strip() for col in (reader.fieldnames or []))):
        missing = required_columns - set(col.strip() for col in (reader.fieldnames or []))
        return {
            'total_rows': 0,
            'created_count': 0,
            'skipped_count': 0,
            'errors': [f"CSV missing mandatory columns: {', '.join(missing)}"],
        }

    # Pre-cache branch and batch records to minimize database lookups
    branches_by_code = {b.code.upper(): b for b in Branch.objects.all()}
    batches_by_year = {b.year: b for b in AdmissionBatch.objects.all()}

    created_count = 0
    skipped_count = 0
    errors = []
    records_to_create = []
    seen_student_ids = set()
    seen_emails = set()

    row_index = 1
    for row in reader:
        row_index += 1
        clean_row = {k.strip(): (v.strip() if v else '') for k, v in row.items()}

        student_id = clean_row.get('student_id', '')
        full_name = clean_row.get('full_name', '')
        email = clean_row.get('institutional_email', '').lower()
        gender = clean_row.get('gender', '').upper()
        dob_str = clean_row.get('date_of_birth', '')
        branch_code = clean_row.get('branch_code', '').upper()
        batch_year_str = clean_row.get('batch_year', '')
        phone = clean_row.get('phone_number', '')

        # Row-level validations
        if not student_id or not full_name or not email or not gender or not dob_str or not branch_code or not batch_year_str:
            errors.append(f"Row {row_index}: Missing required fields for Student ID '{student_id}'.")
            continue

        if student_id in seen_student_ids or email in seen_emails:
            errors.append(f"Row {row_index}: Duplicate Student ID '{student_id}' or Email '{email}' in CSV.")
            continue

        # Validate Email Format
        try:
            validate_email(email)
        except ValidationError:
            errors.append(f"Row {row_index}: Invalid email format '{email}'.")
            continue

        # Validate Gender
        if gender not in Gender.values:
            errors.append(f"Row {row_index}: Invalid gender '{gender}'. Expected MALE, FEMALE, or OTHER.")
            continue

        # Validate Date of Birth (YYYY-MM-DD)
        try:
            dob = datetime.datetime.strptime(dob_str, '%Y-%m-%d').date()
        except ValueError:
            errors.append(f"Row {row_index}: Invalid date format '{dob_str}'. Expected YYYY-MM-DD.")
            continue

        # Resolve Academic Branch
        branch = branches_by_code.get(branch_code)
        if not branch:
            errors.append(f"Row {row_index}: Academic branch '{branch_code}' does not exist.")
            continue

        # Resolve Admission Batch
        try:
            batch_year = int(batch_year_str)
            batch = batches_by_year.get(batch_year)
            if not batch:
                errors.append(f"Row {row_index}: Admission batch year '{batch_year}' does not exist.")
                continue
        except ValueError:
            errors.append(f"Row {row_index}: Invalid batch year integer '{batch_year_str}'.")
            continue

        # Check DB uniqueness
        if StudentRegistry.objects.filter(student_id=student_id).exists():
            skipped_count += 1
            continue

        if StudentRegistry.objects.filter(institutional_email=email).exists():
            errors.append(f"Row {row_index}: Email '{email}' already registered to another student in DB.")
            continue

        seen_student_ids.add(student_id)
        seen_emails.add(email)

        records_to_create.append(
            StudentRegistry(
                student_id=student_id,
                full_name=full_name,
                institutional_email=email,
                gender=gender,
                date_of_birth=dob,
                phone_number=phone if phone else None,
                branch=branch,
                batch=batch,
                enrollment_status=EnrollmentStatus.ACTIVE,
                is_registered=False,
            )
        )

    # Atomic batch insertion
    if records_to_create:
        with transaction.atomic():
            StudentRegistry.objects.bulk_create(records_to_create, batch_size=500)
            created_count = len(records_to_create)

    return {
        'total_rows': row_index - 1,
        'created_count': created_count,
        'skipped_count': skipped_count,
        'errors': errors,
    }

