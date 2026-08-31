import { useMemo, useState } from 'react'
import type { Employee, LoadError } from '../org/types'
import { validate } from '../org/validate'
import { buildTree } from '../org/tree'
import { computeRollups } from '../org/rollups'
import { transfer, type TransferError } from '../org/transfer'
import { mainDepartment } from '../data/mainDepartment'
import { soloDepartment } from '../data/soloDepartment'
import { duplicateIdDept } from '../data/duplicateIdDept'
import { unknownManagerDept } from '../data/unknownManagerDept'
import { cycleDept } from '../data/cycleDept'
import { twoRootsDept } from '../data/twoRootsDept'
import { selfManagerDept } from '../data/selfManagerDept'
import { badFieldDept } from '../data/badFieldDept'
import { precedenceDept } from '../data/precedenceDept'
import { Header, type DatasetOption } from './Header'
import { ErrorPanel } from './ErrorPanel'
import { OrganizationPanel } from './OrganizationPanel'
import { EmployeeTable } from './EmployeeTable'
import { EmployeeDetail } from './EmployeeDetail'
import { TransferPanel, type TransferForm } from './TransferPanel'
import { ImpactPanel, type SuccessfulTransfer } from './ImpactPanel'

interface Dataset extends DatasetOption {
  records: Employee[]
}

const DATASETS: Dataset[] = [
  { id: 'main', label: 'Main department (12)', records: mainDepartment },
  { id: 'solo', label: 'Solo department (1)', records: soloDepartment },
  { id: 'duplicateId', label: 'Invalid: duplicate employee ID', records: duplicateIdDept },
  { id: 'unknownManager', label: 'Invalid: unknown manager', records: unknownManagerDept },
  { id: 'cycle', label: 'Invalid: management cycle', records: cycleDept },
  { id: 'twoRoots', label: 'Invalid: two roots', records: twoRootsDept },
  { id: 'selfManager', label: 'Invalid: self-managed employee', records: selfManagerDept },
  { id: 'badField', label: 'Invalid: malformed fields', records: badFieldDept },
  { id: 'precedence', label: 'Invalid: multiple errors (precedence)', records: precedenceDept },
]

interface TransferAttemptError {
  employeeId: string
  newManagerId: string
  error: TransferError
}

interface LoadedState {
  baseline: Employee[]
  records: Employee[]
  selectedId: string
  form: TransferForm
  lastTransfer: SuccessfulTransfer | null
  transferAttemptError: TransferAttemptError | null
}

type AppData =
  | { status: 'empty' }
  | { status: 'error'; error: LoadError }
  | { status: 'loaded'; data: LoadedState }

const EMPTY_FORM: TransferForm = { employeeId: '', newManagerId: '' }

function App() {
  const [selectedDatasetId, setSelectedDatasetId] = useState(DATASETS[0].id)
  const [data, setData] = useState<AppData>({ status: 'empty' })

  function loadDataset(datasetId: string) {
    const dataset = DATASETS.find((d) => d.id === datasetId)
    if (!dataset) return
    const result = validate(dataset.records)
    if (!result.ok) {
      setData({ status: 'error', error: result.error })
      return
    }
    const root = buildTree(result.employees)
    setData({
      status: 'loaded',
      data: {
        baseline: result.employees,
        records: result.employees,
        selectedId: root.employee.employee_id,
        form: EMPTY_FORM,
        lastTransfer: null,
        transferAttemptError: null,
      },
    })
  }

  function handleLoad() {
    loadDataset(selectedDatasetId)
  }

  function handleQuickLoad(datasetId: string) {
    setSelectedDatasetId(datasetId)
    loadDataset(datasetId)
  }

  function handleReset() {
    if (data.status !== 'loaded') return
    const baseline = data.data.baseline
    const root = buildTree(baseline)
    setData({
      status: 'loaded',
      data: {
        baseline,
        records: [...baseline],
        selectedId: root.employee.employee_id,
        form: EMPTY_FORM,
        lastTransfer: null,
        transferAttemptError: null,
      },
    })
  }

  function handleSelect(id: string) {
    if (data.status !== 'loaded') return
    const loaded = data.data
    setData({ status: 'loaded', data: { ...loaded, selectedId: id } })
  }

  function handleFormChange(form: TransferForm) {
    if (data.status !== 'loaded') return
    const loaded = data.data
    setData({ status: 'loaded', data: { ...loaded, form, transferAttemptError: null } })
  }

  function handleApplyTransfer() {
    if (data.status !== 'loaded') return
    const loaded = data.data
    const { employeeId, newManagerId } = loaded.form
    if (!employeeId || !newManagerId) return

    const outcome = transfer(loaded.records, employeeId, newManagerId)
    if (!outcome.ok) {
      setData({
        status: 'loaded',
        data: {
          ...loaded,
          transferAttemptError: { employeeId, newManagerId, error: outcome.error },
        },
      })
      return
    }

    const oldManagerId = loaded.records.find((e) => e.employee_id === employeeId)!.manager_id!
    setData({
      status: 'loaded',
      data: {
        ...loaded,
        records: outcome.employees,
        selectedId: employeeId,
        form: EMPTY_FORM,
        transferAttemptError: null,
        lastTransfer: {
          employeeId,
          oldManagerId,
          newManagerId,
          previousRollups: outcome.previousRollups,
          newRollups: outcome.newRollups,
          changedRollupIds: outcome.changedRollupIds,
        },
      },
    })
  }

  const derived = useMemo(() => {
    if (data.status !== 'loaded') return null
    const root = buildTree(data.data.records)
    const rollups = computeRollups(root)
    return { root, rollups }
  }, [data])

  const loaded = data.status === 'loaded' ? data.data : null
  const selectedEmployee = loaded?.records.find((e) => e.employee_id === loaded.selectedId)
  const directReportCount = loaded
    ? loaded.records.filter((e) => e.manager_id === loaded.selectedId).length
    : 0
  const changedIds = useMemo(
    () => new Set(loaded?.lastTransfer?.changedRollupIds ?? []),
    [loaded?.lastTransfer],
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Header
        datasets={DATASETS}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
        onLoad={handleLoad}
        onQuickLoad={handleQuickLoad}
        onReset={handleReset}
        canReset={data.status === 'loaded'}
        employeeCount={loaded ? loaded.records.length : null}
        totalPayroll={derived ? derived.rollups[derived.root.employee.employee_id].payroll : null}
      />

      {data.status === 'empty' && (
        <p className="mx-6 mt-6 text-sm text-slate-500">Choose a dataset above and click Load to begin.</p>
      )}

      {data.status === 'error' && <ErrorPanel error={data.error} />}

      {loaded && derived && selectedEmployee && (
        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4 overflow-y-auto pr-2 pb-4">
            <OrganizationPanel
              root={derived.root}
              rollups={derived.rollups}
              selectedId={loaded.selectedId}
              movedId={loaded.lastTransfer?.employeeId ?? null}
              changedIds={changedIds}
              oldManagerId={loaded.lastTransfer?.oldManagerId ?? null}
              newManagerId={loaded.lastTransfer?.newManagerId ?? null}
              onSelect={handleSelect}
            />
            <EmployeeTable
              records={loaded.records}
              rollups={derived.rollups}
              selectedId={loaded.selectedId}
              movedId={loaded.lastTransfer?.employeeId ?? null}
              changedIds={changedIds}
              onSelect={handleSelect}
            />
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 pb-4">
            <EmployeeDetail
              employee={selectedEmployee}
              rollup={derived.rollups[selectedEmployee.employee_id]}
              directReportCount={directReportCount}
            />
            <TransferPanel
              records={loaded.records}
              form={loaded.form}
              onChange={handleFormChange}
              onApply={handleApplyTransfer}
              error={loaded.transferAttemptError}
            />
            <ImpactPanel
              rootId={derived.root.employee.employee_id}
              records={loaded.records}
              lastTransfer={loaded.lastTransfer}
            />
          </div>
        </main>
      )}
    </div>
  )
}

export default App
