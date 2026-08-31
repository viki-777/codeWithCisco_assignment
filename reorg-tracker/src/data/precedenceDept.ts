import type { Employee } from '../org/types'

/**
 * Deliberately carries three simultaneous problems to assert the
 * precedence rule from CLAUDE.md §1:
 *  - DUPLICATE_EMPLOYEE_ID: "MGR_A" appears twice (records 2 and 3)
 *  - INVALID_ROOT_COUNT: two employees (HOD, HOD2) have manager_id null
 *  - UNKNOWN_MANAGER: record 3's manager_id "GHOST" does not exist
 * Duplicate ID (bucket 2) must win over root count (bucket 3) and unknown
 * manager (bucket 4).
 */
export const precedenceDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'HOD' },
  { employee_id: 'MGR_A', name: 'Devika Iyer', role: 'Laboratory manager', monthly_salary: 85000, manager_id: 'GHOST' },
  { employee_id: 'HOD2', name: 'Karan Bose', role: 'Department head', monthly_salary: 140000, manager_id: null },
]
