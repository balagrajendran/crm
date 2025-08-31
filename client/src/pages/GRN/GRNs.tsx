// src/pages/GRN/GRNs.tsx
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap'
import { BsChevronDown, BsChevronRight } from 'react-icons/bs'
import {
  useGetGRNsQuery,
  useDeleteGRNMutation,
  useTransitionGRNMutation,
  GRN,
  GRNItem,
  api,
} from '../../services/api'
import { useAppDispatch } from '../../app/hooks'
import { can, Role } from '../../utils/rbac'
import { NavLink } from 'react-router-dom'

const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export default function GRNs() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isFetching, error, refetch } = useGetGRNsQuery({ page, limit, search })
  const [removeGRN] = useDeleteGRNMutation()
  const [transition] = useTransitionGRNMutation()
  const d = useAppDispatch()

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || 'null') as any, [])
  const role = (user?.role || 'viewer') as Role

  const rows = data?.data ?? []
  const totalRows = data?.total ?? 0

  const [expanded, setExpanded] = useState<number | null>(null)

  async function del(id: number) {
    const patch = d(
      api.util.updateQueryData('getGRNs', { page, limit, search }, (draft: any) => {
        if (!draft?.data) return
        draft.data = draft.data.filter((x: GRN) => x.id !== id)
      }),
    )
    try {
      await removeGRN(id).unwrap()
    } catch {
      patch.undo?.()
    }
    refetch()
  }

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card>
          <Card.Body className="d-flex gap-2 align-items-center flex-wrap">
            <Form.Control
              placeholder="Search GRN#, PO#, vendor, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <Button onClick={() => setPage(1)} disabled={isFetching}>
              Search
            </Button>
          </Card.Body>
        </Card>
      </Col>

      <Col md={12}>
        <Card>
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center">
              <span>Goods Receipt Notes</span>
              <small className="text-muted">{isFetching ? 'Loading…' : null}</small>
            </Card.Title>

            {error && 'status' in error && error.status === 403 && (
              <div className="alert alert-danger">You don’t have permission to view GRNs.</div>
            )}

            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }} />
                  <th>ID</th>
                  <th>GRN #</th>
                  <th>PO #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((grn: any) => (
                  <tr key={grn.id}>
                    <td>
                      <Button
                        size="sm"
                        variant="light"
                        className="p-0"
                        onClick={() => setExpanded(expanded === grn.id ? null : grn.id)}
                        aria-label="expand"
                      >
                        {expanded === grn.id ? <BsChevronDown /> : <BsChevronRight />}
                      </Button>
                    </td>
                    <td>{grn.id}</td>
                    <td className="fw-semibold">{grn.number}</td>

                    {/* Linked PO number (clickable to your PO page if you have a route), else plain text */}
                    <td>
                      {grn.PurchaseOrder?.number ? (
                        <NavLink to="/purchase-orders" className="text-decoration-none">
                          {grn.PurchaseOrder.number}
                        </NavLink>
                      ) : (
                        grn.PurchaseOrderId
                      )}
                    </td>

                    <td>{grn.PurchaseOrder?.vendor ?? '—'}</td>
                    <td>{grn.receivedDate?.slice(0, 10) ?? '—'}</td>
                    <td>
                      <Badge
                        bg={
                          grn.status === 'approved'
                            ? 'success'
                            : grn.status === 'cancelled'
                            ? 'danger'
                            : 'secondary'
                        }
                        className="text-capitalize"
                      >
                        {grn.status}
                      </Badge>
                    </td>
                    <td className="d-flex flex-wrap gap-2">
                      {/* Cancel (void) */}
                      {can(role, 'update', 'grns') && grn.status !== 'cancelled' && (
                        <OverlayTrigger overlay={<Tooltip>Cancel (void) this GRN</Tooltip>}>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={async () => {
                              await transition({ id: grn.id, action: 'cancel' }).unwrap()
                              refetch()
                            }}
                          >
                            Cancel
                          </Button>
                        </OverlayTrigger>
                      )}

                      {/* Delete only when not approved (safety) */}
                      {can(role, 'delete', 'grns') && grn.status !== 'approved' && (
                        <Button size="sm" variant="danger" onClick={() => del(grn.id)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Expanded rows (render after each row to keep tbody keys simple) */}
                {rows.map((grn: any) =>
                  expanded === grn.id ? (
                    <tr key={`exp-${grn.id}`}>
                      <td />
                      <td colSpan={7}>
                        <Table size="sm" bordered className="mb-2">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th className="text-end">Ordered</th>
                              <th className="text-end">Received (this)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(grn.items as GRNItem[] | undefined)?.map((it) => (
                              <tr key={it.id}>
                                <td>{it.product}</td>
                                <td className="text-end">{num(it.qtyOrdered)}</td>
                                <td className="text-end">{num(it.qtyReceived)}</td>
                              </tr>
                            ))}
                            {(!grn.items || grn.items.length === 0) && (
                              <tr>
                                <td colSpan={3} className="text-center text-muted">
                                  No lines
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </td>
                    </tr>
                  ) : null
                )}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No GRNs
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                Page {page} of {Math.max(1, Math.ceil(totalRows / limit))}
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <Button
                  size="sm"
                  disabled={page >= Math.ceil(totalRows / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}
