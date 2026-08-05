"""One-off local seeding script — safe to delete after use.

Run inside the backend container: docker compose exec backend python -m scripts._seed_test_docs
"""
import asyncio

from app.db.session import AsyncSessionLocal
from app.models.chunk import Chunk
from app.models.document import Document
from app.services.ingestion_service import ingest_document
from sqlalchemy import delete, select

OLD_STUB_TITLES = [
    "[TEST DATA] Employee Leave Policy",
    "[TEST DATA] IT Security & Password Policy",
]

DOCS = [
    {
        "title": "Travel_Reimbursement_Policy.pdf",
        "content": """Travel & Expense Reimbursement Policy
Effective January 2026 · Finance & Operations

1. Purpose
This policy governs travel booking, expense claims, and reimbursement for all employees traveling for company business.

2. Booking Travel
- All domestic and international travel must be booked at least 5 working days in advance through the company travel portal.
- Flights: economy class for domestic travel; premium economy for international flights exceeding 6 hours.
- Hotel accommodation: up to ₹8,000 per night domestically, up to ₹15,000 per night internationally.
- Ground transport: employees may expense taxis, ride-share, or airport transfers with a valid receipt.

3. Daily Allowance (Per Diem)
Domestic travel: ₹2,500 / day. International travel: ₹6,000 / day.
Per diem covers meals and incidental expenses and does not require individual receipts. It is paid automatically once a travel claim is approved.

4. Expense Claim Process
- Submit all expense claims within 15 days of returning from travel via the Finance portal.
- Claims must be accompanied by original receipts for any single expense over ₹1,000.
- Claims are reviewed by your manager first, then by Finance for final approval.
- Approved reimbursements are paid out within 10 working days, along with the next payroll cycle where possible.

5. Non-Reimbursable Expenses
- Alcohol, unless part of an approved client entertainment budget.
- Personal entertainment, mini-bar charges, or spa services.
- Traffic fines or penalties incurred during travel.
- Upgrades to business/first class without prior written approval from a department head.

6. Client Entertainment
Client meals and entertainment may be expensed up to ₹5,000 per event, with prior manager approval and an itemized receipt listing all attendees.

7. Mileage (Personal Vehicle Use)
Employees using a personal vehicle for business travel may claim ₹12 per kilometer, calculated from the most direct route between the origin and destination.

8. Advance Travel Funds
Employees traveling internationally may request a travel advance of up to 70% of the estimated trip cost, to be reconciled with actual receipts within 10 days of return.

9. Contact
For travel bookings: travel@company.com. For expense claim questions: finance@company.com.""",
        "restricted_role": None,
    },
    {
        "title": "Remote_Work_Policy.pdf",
        "content": """Hybrid & Remote Work Policy
Effective January 2026 · Human Resources

1. Overview
The company operates a hybrid work model designed to balance in-person collaboration with the flexibility of remote work. This policy applies to all full-time employees unless their role requires full-time office presence (e.g. facilities, front-desk, or lab-based roles).

2. Standard Hybrid Schedule
- In-office days: Tuesday, Wednesday, and Thursday.
- Remote-eligible days: Monday and Friday.
- Teams may agree on a different in-office schedule with department head approval, provided at least 3 in-office days per week are maintained.

3. Fully Remote Work
Employees may request fully remote work arrangements (working from a different city, or a temporary extended remote period) through their manager and HR. Fully remote arrangements are reviewed quarterly and are not guaranteed beyond the approved period.

4. Home Office Setup
Employees working remotely are provided a one-time home office setup allowance of ₹10,000, covering items such as a desk, chair, or monitor. This can be claimed once per employee, within the first 6 months of a remote or hybrid arrangement being approved.

5. Availability Expectations
- All employees, regardless of location, must be reachable during core hours: 11:00 AM to 4:00 PM.
- Camera-on is expected for scheduled meetings unless otherwise agreed with the meeting organizer.
- Response time for internal messages during working hours should not exceed 2 hours.

6. International Remote Work
Working remotely from a different country for more than 15 consecutive days requires prior approval from HR and Legal, due to tax and compliance considerations. Unapproved international remote work may result in payroll or visa complications and is strongly discouraged.

7. Equipment & Connectivity
The company provides a laptop and, where applicable, a monthly internet reimbursement of ₹1,500 for employees on an approved remote work arrangement.

8. Review & Exceptions
This policy is reviewed annually by HR. Exceptions to the standard hybrid schedule (e.g. medical accommodations) can be requested through HR and are handled on a case-by-case, confidential basis.

9. Contact
For questions about hybrid or remote work arrangements, contact hr@company.com.""",
        "restricted_role": None,
    },
    {
        "title": "Leave_Policy.pdf",
        "content": """Leave & Time Off Policy
Effective January 2026 · Human Resources

1. Overview
This policy outlines the paid and unpaid leave entitlements available to all full-time employees. All leave requests must be submitted and approved through the internal HR system prior to the leave start date, except in documented emergencies.

2. Annual Leave (Paid Time Off)
Full-time employees accrue 18 days of paid annual leave per calendar year, credited monthly at a rate of 1.5 days per month of active employment.
Employee tenure and annual leave entitlement: 0-2 years = 18 days/year, 2-5 years = 21 days/year, 5+ years = 24 days/year.
Unused annual leave may be carried forward into the next calendar year up to a maximum of 10 days. Any balance beyond this cap is forfeited on December 31st unless an exception is approved by HR.

3. Sick Leave
Employees are entitled to 12 days of paid sick leave per year. A medical certificate is required for sick leave exceeding 2 consecutive days. Sick leave does not carry forward to the following year and is not paid out upon resignation or termination.

4. Casual Leave
Employees may take up to 7 days of casual leave per year for personal matters not covered under sick or annual leave. Casual leave requests should be submitted at least 24 hours in advance where possible.

5. Maternity & Paternity Leave
- Maternity leave: 26 weeks of fully paid leave, in accordance with statutory requirements.
- Paternity leave: 2 weeks of fully paid leave, to be taken within 3 months of the child's birth or adoption.
- Adoption leave: employees adopting a child under the age of 1 are entitled to the same leave as maternity leave.

6. Bereavement Leave
Employees may take up to 5 days of paid bereavement leave in the event of the death of an immediate family member (spouse, child, parent, or sibling), and up to 2 days for extended family.

7. How to Apply for Leave
- Submit a leave request through the HR portal at least 3 working days in advance for planned leave.
- Your reporting manager will approve or reject the request within 2 working days.
- For emergency leave, notify your manager as soon as possible and file the formal request retroactively within 48 hours.
- Leave balances are visible at any time in the HR portal under "My Leave."

8. Public Holidays
The company observes 12 public holidays per year, published annually by HR in January. Employees required to work on a public holiday are entitled to a compensatory day off within the following 30 days.

9. Unpaid Leave
Employees who have exhausted their paid leave balance may request unpaid leave of up to 30 days, subject to manager and HR approval. Requests for unpaid leave exceeding 30 days are reviewed on a case-by-case basis by senior HR leadership.

10. Contact
For questions about this policy, contact the HR team at hr@company.com or through the internal HR portal.""",
        "restricted_role": None,
    },
    {
        "title": "Employee_Handbook.pdf",
        "content": """Employee Handbook
Effective January 2026 · Human Resources

1. Welcome
This handbook outlines the core policies, expectations, and benefits that apply to every employee. It is intended as a practical reference, not a legal contract, and is reviewed annually by HR.

2. Working Hours
Standard working hours are 9:30 AM to 6:30 PM, Monday through Friday, with a 1-hour lunch break. The company operates a hybrid work model: employees are expected in the office on Tuesdays, Wednesdays, and Thursdays, with Mondays and Fridays available for remote work.
Core collaboration hours (when all employees should be reachable regardless of location) are 11:00 AM to 4:00 PM.

3. Code of Conduct
- Treat colleagues, clients, and partners with respect and professionalism at all times.
- Harassment, discrimination, or retaliation of any kind will not be tolerated and should be reported immediately to HR.
- Confidential company and client information must not be shared outside the organization without authorization.
- Conflicts of interest (e.g. outside employment, financial interests in vendors) must be disclosed to your manager and HR.

4. Probation Period
New employees serve a probation period of 3 months from their start date. During this period, either party may terminate employment with 2 weeks' written notice. A formal review is conducted at the end of the probation period to confirm continued employment.

5. Performance Reviews
Formal performance reviews are conducted twice a year, in June and December. Reviews include a self-assessment, manager assessment, and a calibration discussion. Compensation reviews are tied to the December cycle.

6. Compensation & Payroll
- Salaries are paid monthly, on the last working day of each month, via direct bank transfer.
- Payslips are available in the HR portal by the 1st of the following month.
- Any payroll discrepancies should be reported to payroll@company.com within 5 working days of the pay date.

7. Benefits
- Health insurance: full coverage for the employee, with the option to add dependents at a subsidized rate.
- Annual wellness allowance of ₹15,000 for gym memberships, fitness classes, or mental health support.
- Learning & development budget of ₹25,000 per year for courses, certifications, or conference attendance, subject to manager approval.
- Employee referral bonus of ₹50,000 for successful hires, paid after the referred employee completes 6 months.

8. Equipment & IT
All employees are issued a company laptop and are expected to use company-approved software for work-related tasks. IT support requests should be filed through the internal IT helpdesk, with a standard response time of 1 business day for non-urgent issues and 2 hours for critical (work-blocking) issues.

9. Resignation Process
Employees wishing to resign must provide written notice to their manager and HR. The standard notice period is 30 days for individual contributors and 60 days for managers and above. A full and final settlement, including any pending reimbursements and leave encashment, is processed within 45 days of the last working day.

10. Grievance Redressal
Any workplace concern or grievance can be raised confidentially with HR via hr@company.com, or through the anonymous feedback channel in the HR portal. All grievances are acknowledged within 3 working days and investigated in line with the company's internal grievance policy.

11. Contact
General HR queries: hr@company.com. IT support: it-support@company.com. Payroll: payroll@company.com.""",
        "restricted_role": None,
    },
]


async def main():
    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(Document.title.in_(OLD_STUB_TITLES))
        old_docs = (await db.execute(stmt)).scalars().all()
        for doc in old_docs:
            await db.execute(delete(Chunk).where(Chunk.document_id == doc.id))
            await db.delete(doc)
            print(f"Removed old stub: {doc.title}")
        await db.commit()

        for doc in DOCS:
            result = await ingest_document(
                db,
                title=doc["title"],
                content=doc["content"],
                source="manual_test_seed",
                restricted_role=doc["restricted_role"],
            )
            print(f"Ingested: {result.title} (id={result.id})")


if __name__ == "__main__":
    asyncio.run(main())
