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
    Hostel, Block, Floor, Room, Bed, BedStatus, RoomCategory,
    GenderPolicy, HostelStatus, WashroomType, RoomStatus,
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

        # 4. Hostels Fleet — Official LPU 19 Hostels (BH-1..BH-10 incl. Boys Studio 9 & GH-1..GH-8 incl. Girls Studio 9)
        boys_hostels_info = [
            ('BH-1', 'Boys Hostel 1', 'Official LPU residential block offering 4x2-seater (incl. above-porch), multi-seater, and standard AC/air-cooled rooms with biometric turnstile gates, Pro Bricks vegetarian mess, and 24x7 hotline backup.'),
            ('BH-2', 'Boys Hostel 2', 'Centrally positioned boys residential complex featuring 1 to 6-seater AC and air-cooled rooms, attached washrooms with winter geyser supply, 650 Mbps campus Wi-Fi, and study rooms.'),
            ('BH-3', 'Boys Hostel 3', 'Multi-storey student residence near academic blocks with attached washrooms, tuck shop, indoor recreation hall, CCTV surveillance, and automated metro-style turnstile entry.'),
            ('BH-4', 'Boys Hostel 4', 'Large boys residential block with Pro Bricks standard 4-cuisine mess hall, in-house automated laundry (up to 70 garments/mo), designated two-wheeler parking, and 24x7 security.'),
            ('BH-5', 'Boys Hostel 5', 'Popular boys residential wing providing Standard Rooms and Studio Apartments, box-storage beds, automatic chapatti dining kitchen, vending kiosks, and 24x7 Uni-Hospital emergency access.'),
            ('BH-6', 'Boys Hostel 6', 'Multi-storey residential block offering Standard AC/air-cooled suites and Studio Apartments, elevator access, reading hall, departmental kiosk, and subsidized Indoor Stadium gym connectivity.'),
            ('BH-7', 'Boys Hostel 7', 'High-capacity boys block near LPU Indoor Stadium and sports courts, featuring AC and cooler wings, 24-hour water supply, generator light-load backup, and Pro Bricks dining.'),
            ('BH-8', 'Boys Hostel 8', 'Modern Boys Hostel & Studio Apartment complex equipped with Hot & Cold Split ACs (select suites), attached washrooms, pantry space (5A appliance load), and biometric gate control.'),
            ('BH-9', 'Boys Studio 9 (BH-9)', 'Dedicated Boys Studio Apartment complex featuring 1 to 4-seater Hot & Cold Split AC suites, box-storage beds, kitchenette/pantry lobby (5A load), attached geysers, and biometric turnstiles.'),
            ('BH-10', 'Boys Hostel 10 (BH-10)', 'Newer high-rise boys residential expansion offering 1 to 4-seater AC and Studio Apartment configurations, high-speed elevators, study lounges, and Pro Bricks dining.'),
        ]

        girls_hostels_info = [
            ('GH-1', 'Girls Hostel 1', 'Official LPU girls residential complex featuring 24x7 female security personnel, biometric turnstile gates, CCTV surveillance, Pro Bricks vegetarian mess, and attached washrooms with winter geysers.'),
            ('GH-2', 'Girls Hostel 2', 'Secure multi-storey girls block near Uni-Mall with Standard AC and air-cooled wings, in-house laundry service, quiet study room, and 650 Mbps leased-line Wi-Fi + Intranet UMS access.'),
            ('GH-3', 'Girls Hostel 3', 'Residential girls complex offering 1 to 4-seater Standard Rooms and Studio Apartments, elevator access, scheduled hot water supply, vending kiosks, and indoor fitness hall.'),
            ('GH-4', 'Girls Hostel 4', 'Well-connected girls block close to Central Library (Block 37) and academic blocks, featuring Standard AC/cooler suites, study lounge, and 24x7 30-bed Uni-Hospital ambulance support.'),
            ('GH-5', 'Girls Hostel 5', 'Multi-wing girls residential tower offering Pro Bricks regional vegetarian menus (North/South Indian, Rajasthani, Haryanvi, North-Eastern), automated laundry, and common recreation lounge.'),
            ('GH-6', 'Girls Hostel 6', 'Modern girls complex with Standard Rooms and Studio Apartments, ergonomic study tables, box-storage beds, tuck/utility stores, and RFID campus security perimeter.'),
            ('GH-7', 'Girls Hostel 7', 'Modern LPU girls residence and Studio Apartment complex offering AC suites, attached pantry & washrooms, green landscaped courtyard, and round-the-clock warden supervision.'),
            ('GH-8', 'Girls Hostel 8 (GH-8)', 'Expanded girls residential block offering 1 to 6-seater AC and air-cooled suites, attached washrooms with winter geysers, biometric gate security, and 24x7 female residential wardens.'),
            ('GS-9', 'Girls Studio 9 (Apartments)', 'Dedicated Girls Studio Apartment block offering 1 to 4-seater Hot & Cold Split AC suites, pantry lobby (5A load), modular wardrobes, attached geysers, and direct Uni-Hospital hotline.'),
        ]

        # Blueprint room configurations representing LPU 10-month session fee catalog
        room_blueprint_floor1 = [
            # 1-Seaters
            ('101', 1, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('102', 1, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            # 2-Seaters
            ('103', 2, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('104', 2, RoomCategory.STANDARD, False, WashroomType.SHARED),
            ('105', 2, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            # 3-Seaters
            ('106', 3, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('107', 3, RoomCategory.STANDARD, False, WashroomType.SHARED),
            ('108', 3, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
        ]

        room_blueprint_floor2 = [
            # 4-Seaters
            ('201', 4, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('202', 4, RoomCategory.STANDARD, False, WashroomType.SHARED),
            ('203', 4, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            # 5-Seaters
            ('204', 5, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('205', 5, RoomCategory.STANDARD, False, WashroomType.SHARED),
            # 6, 7, 8 Seaters & Dormitories
            ('206', 6, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('207', 6, RoomCategory.STANDARD, False, WashroomType.SHARED),
            ('208', 7, RoomCategory.STANDARD, False, WashroomType.SHARED),
            ('209', 8, RoomCategory.DORMITORY, False, WashroomType.SHARED),
        ]

        studio_blueprint_floor1 = [
            ('101', 1, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('102', 1, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('103', 2, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('104', 2, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('105', 3, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('106', 3, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
        ]

        studio_blueprint_floor2 = [
            ('201', 2, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('202', 3, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('203', 4, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('204', 4, RoomCategory.STUDIO_APARTMENT, True, WashroomType.ATTACHED),
            ('205', 1, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
            ('206', 2, RoomCategory.STANDARD, True, WashroomType.ATTACHED),
        ]

        boys_hostel_objects = []
        girls_hostel_objects = []

        def populate_hostel(hostel_obj, is_female=False, is_studio_complex=False):
            blocks = ['Block A', 'Block B'] if not is_female else ['Wing Alpha', 'Wing Beta']
            floor_blueprints = (
                [(1, studio_blueprint_floor1), (2, studio_blueprint_floor2)]
                if is_studio_complex
                else [(1, room_blueprint_floor1), (2, room_blueprint_floor2)]
            )
            total_beds_created = 0

            for block_name in blocks:
                block, _ = Block.objects.get_or_create(hostel=hostel_obj, name=block_name)
                for floor_num, blueprint in floor_blueprints:
                    floor, _ = Floor.objects.get_or_create(block=block, floor_number=floor_num)
                    for r_num, cap, cat, is_ac, washroom in blueprint:
                        prefix = f"{'G-' if is_female else ''}"
                        full_room_number = f"{prefix}{r_num}"
                        room, _ = Room.objects.get_or_create(
                            floor=floor,
                            room_number=full_room_number,
                            defaults={
                                'capacity': cap,
                                'category': cat,
                                'washroom_type': washroom,
                                'is_air_conditioned': is_ac,
                                'status': RoomStatus.AVAILABLE,
                            }
                        )
                        if room.category != cat:
                            room.category = cat
                            room.save()

                        # Attach facilities
                        facs_to_add = [fac_wifi]
                        if is_ac:
                            facs_to_add.append(fac_ac)
                        if washroom == WashroomType.ATTACHED:
                            facs_to_add.append(fac_geyser)
                        if cat == RoomCategory.STUDIO_APARTMENT:
                            facs_to_add.append(fac_balcony)

                        for f in facs_to_add:
                            RoomFacility.objects.get_or_create(room=room, facility=f)

                        # Generate beds
                        for b_idx in range(cap):
                            b_ident = chr(ord('A') + b_idx)
                            Bed.objects.get_or_create(
                                room=room,
                                bed_identifier=b_ident,
                                defaults={'status': BedStatus.VACANT}
                            )
                            total_beds_created += 1

            hostel_obj.total_capacity = total_beds_created
            hostel_obj.save()

        # Seed Boys Hostels (use update_or_create so official LPU names/descriptions sync cleanly)
        for code, name, desc in boys_hostels_info:
            h, _ = Hostel.objects.update_or_create(
                code=code,
                defaults={
                    'university': univ,
                    'name': name,
                    'gender_policy': GenderPolicy.MALE,
                    'status': HostelStatus.ACTIVE,
                    'description': desc
                }
            )
            populate_hostel(h, is_female=False, is_studio_complex=(code in ('BH-9', 'BH-10')))
            boys_hostel_objects.append(h)

        # Seed Girls Hostels
        for code, name, desc in girls_hostels_info:
            h, _ = Hostel.objects.update_or_create(
                code=code,
                defaults={
                    'university': univ,
                    'name': name,
                    'gender_policy': GenderPolicy.FEMALE,
                    'status': HostelStatus.ACTIVE,
                    'description': desc
                }
            )
            populate_hostel(h, is_female=True, is_studio_complex=(code == 'GS-9'))
            girls_hostel_objects.append(h)

        h1 = boys_hostel_objects[0] # BH-1
        h2 = boys_hostel_objects[1] # BH-2
        h3 = girls_hostel_objects[0] # GH-1

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

        for bh in boys_hostel_objects:
            WardenAssignment.objects.get_or_create(
                user=warden_boys,
                hostel=bh,
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

        for gh in girls_hostel_objects:
            WardenAssignment.objects.get_or_create(
                user=warden_girls,
                hostel=gh,
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

        self.stdout.write(self.style.SUCCESS(f"Demo data successfully seeded! Generated {Hostel.objects.count()} hostels, {Room.objects.count()} rooms, {Bed.objects.count()} beds."))
        self.stdout.write(self.style.SUCCESS("Available login accounts (Password: Password123!):"))
        self.stdout.write("  Admin:   admin@lpu.in")
        self.stdout.write("  Warden:  warden.boys@lpu.in, warden.girls@lpu.in")
        self.stdout.write("  Student: arjun.sharma@lpu.in (ID: 12400001)")
        self.stdout.write("           rohit.verma@lpu.in  (ID: 12400002)")
        self.stdout.write("           priya.patel@lpu.in  (ID: 12400005)")
