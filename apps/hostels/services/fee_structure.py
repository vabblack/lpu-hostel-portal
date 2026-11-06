"""
LPU Fee Structure and Electricity Allowance Master (10-Month Academic Session).
Encapsulates tier pricing, Early Decision Benefit (EDB), and resident overage division.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Tuple, Optional


@dataclass(frozen=True)
class FeeTierConfig:
    category: str       # 'STANDARD', 'STUDIO_APARTMENT', 'DORMITORY'
    seater_count: int   # 1 to 8 (4x2 represented as 8)
    cooling_type: str   # 'AIR_COOLED', 'AIR_CONDITIONED'
    standard_fee: Decimal
    edb_fee: Decimal
    quota_kwh: Decimal


# Exact Lovely Professional University (LPU) 10-Month Session Fee Matrix
LPU_FEE_CATALOG: Dict[Tuple[str, int, str], FeeTierConfig] = {
    # 1-Seater
    ('STANDARD', 1, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 1, 'AIR_CONDITIONED',
        Decimal('163000.00'), Decimal('153000.00'), Decimal('1000.00')
    ),
    ('STUDIO_APARTMENT', 1, 'AIR_CONDITIONED'): FeeTierConfig(
        'STUDIO_APARTMENT', 1, 'AIR_CONDITIONED',
        Decimal('200000.00'), Decimal('190000.00'), Decimal('1000.00')
    ),

    # 2-Seater
    ('STANDARD', 2, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 2, 'AIR_COOLED',
        Decimal('123000.00'), Decimal('113000.00'), Decimal('400.00')
    ),
    ('STANDARD', 2, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 2, 'AIR_CONDITIONED',
        Decimal('143000.00'), Decimal('133000.00'), Decimal('750.00')
    ),
    ('STUDIO_APARTMENT', 2, 'AIR_CONDITIONED'): FeeTierConfig(
        'STUDIO_APARTMENT', 2, 'AIR_CONDITIONED',
        Decimal('150000.00'), Decimal('140000.00'), Decimal('750.00')
    ),

    # 3-Seater
    ('STANDARD', 3, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 3, 'AIR_COOLED',
        Decimal('108000.00'), Decimal('98000.00'), Decimal('350.00')
    ),
    ('STANDARD', 3, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 3, 'AIR_CONDITIONED',
        Decimal('123000.00'), Decimal('113000.00'), Decimal('550.00')
    ),
    ('STUDIO_APARTMENT', 3, 'AIR_CONDITIONED'): FeeTierConfig(
        'STUDIO_APARTMENT', 3, 'AIR_CONDITIONED',
        Decimal('130000.00'), Decimal('120000.00'), Decimal('550.00')
    ),

    # 4-Seater
    ('STANDARD', 4, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 4, 'AIR_COOLED',
        Decimal('93000.00'), Decimal('83000.00'), Decimal('300.00')
    ),
    ('STANDARD', 4, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 4, 'AIR_CONDITIONED',
        Decimal('103000.00'), Decimal('93000.00'), Decimal('500.00')
    ),
    ('STUDIO_APARTMENT', 4, 'AIR_CONDITIONED'): FeeTierConfig(
        'STUDIO_APARTMENT', 4, 'AIR_CONDITIONED',
        Decimal('110000.00'), Decimal('100000.00'), Decimal('500.00')
    ),

    # 5-Seater
    ('STANDARD', 5, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 5, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('300.00')
    ),
    ('STANDARD', 5, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 5, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('400.00')
    ),

    # 6, 7, 8, 4x2 Seaters
    ('STANDARD', 6, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 6, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('STANDARD', 6, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 6, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),
    ('STANDARD', 7, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 7, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('STANDARD', 7, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 7, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),
    ('STANDARD', 8, 'AIR_COOLED'): FeeTierConfig(
        'STANDARD', 8, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('STANDARD', 8, 'AIR_CONDITIONED'): FeeTierConfig(
        'STANDARD', 8, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),

    # Dormitories (High occupancy shared washroom 6, 7, 8-seaters)
    ('DORMITORY', 6, 'AIR_COOLED'): FeeTierConfig(
        'DORMITORY', 6, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('DORMITORY', 6, 'AIR_CONDITIONED'): FeeTierConfig(
        'DORMITORY', 6, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),
    ('DORMITORY', 7, 'AIR_COOLED'): FeeTierConfig(
        'DORMITORY', 7, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('DORMITORY', 7, 'AIR_CONDITIONED'): FeeTierConfig(
        'DORMITORY', 7, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),
    ('DORMITORY', 8, 'AIR_COOLED'): FeeTierConfig(
        'DORMITORY', 8, 'AIR_COOLED',
        Decimal('80000.00'), Decimal('70000.00'), Decimal('250.00')
    ),
    ('DORMITORY', 8, 'AIR_CONDITIONED'): FeeTierConfig(
        'DORMITORY', 8, 'AIR_CONDITIONED',
        Decimal('90000.00'), Decimal('80000.00'), Decimal('350.00')
    ),
}


def get_fee_tier(
    category: str,
    seater_count: int,
    cooling_type: str
) -> Optional[FeeTierConfig]:
    """Look up tier configuration for room specifications."""
    return LPU_FEE_CATALOG.get((category.upper(), seater_count, cooling_type.upper()))


def calculate_room_fee(
    category: str,
    seater_count: int,
    cooling_type: str,
    is_edb_eligible: bool = False
) -> Decimal:
    """
    Compute applicable 10-month hostel fee applying EDB discount if eligible.
    """
    tier = get_fee_tier(category, seater_count, cooling_type)
    if not tier:
        raise ValueError(f"No fee tier found for {seater_count}-seater {category} ({cooling_type})")
    return tier.edb_fee if is_edb_eligible else tier.standard_fee


def calculate_electricity_overage(
    consumed_units: Decimal,
    allocated_quota: Decimal,
    resident_count: int,
    commercial_rate: Decimal = Decimal('8.50')
) -> Dict[str, Decimal]:
    """
    LPU Electricity Overage Rule:
    Consumption exceeding the room quota is billed at commercial rate
    and divided equally among all registered room occupants.
    """
    if resident_count <= 0:
        raise ValueError("Resident count must be at least 1.")

    overage_units = max(Decimal('0.00'), consumed_units - allocated_quota)
    total_overage_charge = (overage_units * commercial_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    per_resident_share = (total_overage_charge / Decimal(resident_count)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return {
        'consumed_units': consumed_units,
        'allocated_quota': allocated_quota,
        'overage_units': overage_units,
        'rate_per_unit': commercial_rate,
        'total_overage_charge': total_overage_charge,
        'resident_count': Decimal(resident_count),
        'per_resident_share': per_resident_share,
    }

