export type ErrorCode =
  | 'INVALID_EMPLOYEE'
  | 'DUPLICATE_EMPLOYEE_ID'
  | 'INVALID_ROOT_COUNT'
  | 'UNKNOWN_MANAGER'
  | 'SELF_MANAGER'
  | 'MANAGEMENT_CYCLE'

export interface Employee {
  employee_id: string
  name: string
  role: string
  monthly_salary: number
  manager_id: string | null
}

export interface LoadError {
  code: ErrorCode
  message: string
}

export type LoadResult =
  | { ok: true; employees: Employee[] }
  | { ok: false; error: LoadError }

export interface TreeNode {
  employee: Employee
  children: TreeNode[]
}
