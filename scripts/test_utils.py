def split_bill(total: float, num_people: int, tip_percent: float = 0.0) -> dict:
    if num_people <= 0:
        raise ValueError("Number of people must be greater than zero")
    tip = total * (tip_percent / 100)
    grand_total = total + tip
    per_person = grand_total / num_people
    return {
        "subtotal": round(total, 2),
        "tip": round(tip, 2),
        "total": round(grand_total, 2),
        "per_person": round(per_person, 2),
    }


if __name__ == "__main__":
    result = split_bill(total=120.00, num_people=4, tip_percent=18)
    print(result)
