// src/pages/Invoices/Invoices.tsx
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useTransitionInvoiceMutation,
  Invoice,
  InvoiceItem,
  api,
} from "../../services/api";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ModalForm from "../../components/ModalForm";
import { useAppDispatch } from "../../app/hooks";
import { can, Role } from "../../utils/rbac";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import { exportInvoicePDF } from "../../utils/invoicePdf";

/** number-safe helper (DECIMALs may arrive as strings) */
const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ----------------------------- Validation schema ---------------------------- */
const itemSchema = z.object({
  description: z.string().min(1, "Description required"),
  qty: z.coerce.number().int().min(1, "Qty ≥ 1"),
  price: z.coerce.number().min(0, "Price ≥ 0"),
});

const schema = z.object({
  number: z.string().optional(), // server auto-numbers when empty
  customer: z.string().min(2, "Customer required"),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "void"]),
  subtotal: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
  CompanyId: z.preprocess(
    (v) => (v === "" ? undefined : Number(v)),
    z.number().optional()
  ),
  items: z.array(itemSchema).min(1, "Add at least one line"),
});
type FormValues = z.infer<typeof schema>;

/* ---------------------------------- View ----------------------------------- */
export default function Invoices() {
  // query + mutations
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isFetching, refetch } = useGetInvoicesQuery({
    page,
    limit,
    search,
  });
  const [createIt] = useCreateInvoiceMutation();
  const [updateIt] = useUpdateInvoiceMutation();
  const [deleteIt] = useDeleteInvoiceMutation();
  const [transition] = useTransitionInvoiceMutation();
  const d = useAppDispatch();

  // auth/role
  const user =
    (JSON.parse(localStorage.getItem("user") || "null") as any) || null;
  const role = (user?.role || "viewer") as Role;

  // modal + expanded
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // form
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: "",
      invoiceDate: "",
      dueDate: "",
      status: "draft",
      subtotal: 0,
      tax: 0,
      total: 0,
      items: [{ description: "", qty: 1, price: 0 }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const items = watch("items");
  const tax = num(watch("tax"));
  const subtotal = useMemo(
    () => (items || []).reduce((s, it) => s + num(it.qty) * num(it.price), 0),
    [items]
  );
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  function openAdd() {
    setEditing(null);
    reset({
      customer: "",
      invoiceDate: "",
      dueDate: "",
      status: "draft",
      subtotal: 0,
      tax: 0,
      total: 0,
      items: [{ description: "", qty: 1, price: 0 }],
    });
    setShow(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    reset({
      number: inv.number,
      customer: inv.customer,
      invoiceDate: inv.invoiceDate?.slice(0, 10),
      dueDate: inv.dueDate?.slice(0, 10),
      status: inv.status,
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      CompanyId: inv.CompanyId,
      items: (inv.items || []).map((i) => ({
        description: i.description,
        qty: i.qty,
        price: i.price,
      })),
    });
    if (!inv.items?.length) replace([{ description: "", qty: 1, price: 0 }]);
    setShow(true);
  }

  const close = () => setShow(false);

  async function onSubmit(v: FormValues) {
    const payload: FormValues = {
      ...v,
      subtotal,
      total: subtotal + num(v.tax),
    };

    if (editing) {
      const patch = d(
        api.util.updateQueryData(
          "getInvoices",
          { page, limit, search },
          (draft: any) => {
            const i = draft.data.findIndex((x: Invoice) => x.id === editing.id);
            if (i > -1) draft.data[i] = { ...draft.data[i], ...payload };
          }
        )
      );
      try {
        await updateIt({ id: editing.id, ...(payload as any) }).unwrap();
      } catch {
        patch.undo();
      }
    } else {
      const tempId = Math.floor(Math.random() * -1e9);
      const patch = d(
        api.util.updateQueryData(
          "getInvoices",
          { page, limit, search },
          (draft: any) => {
            draft.data.unshift({
              id: tempId,
              number: "INV-PENDING",
              ...payload,
            });
          }
        )
      );
      try {
        await createIt(payload as any).unwrap();
      } catch {
        patch.undo();
      }
    }
    close();
    refetch();
  }

  async function del(id: number) {
    const patch = d(
      api.util.updateQueryData(
        "getInvoices",
        { page, limit, search },
        (draft: any) => {
          draft.data = draft.data.filter((x: Invoice) => x.id !== id);
        }
      )
    );
    try {
      await deleteIt(id).unwrap();
    } catch {
      patch.undo();
    }
    refetch();
  }

  const rows = data?.data ?? [];
  const totalRows = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card>
          <Card.Body className="d-flex gap-2 align-items-center flex-wrap">
            <Form.Control
              placeholder="Search INV#, customer, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <Button onClick={() => setPage(1)} disabled={isFetching}>
              Search
            </Button>
            {can(role, "create", "invoices") && (
              <Button variant="success" onClick={openAdd}>
                New Invoice
              </Button>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={12}>
        <Card>
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center">
              <span>Invoices</span>
              <small className="text-muted">
                {isFetching ? "Loading…" : null}
              </small>
            </Card.Title>

            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>ID</th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv: Invoice) => (
                  <>
                    <tr key={inv.id}>
                      <td>
                        <Button
                          size="sm"
                          variant="light"
                          className="p-0"
                          onClick={() =>
                            setExpanded(expanded === inv.id ? null : inv.id)
                          }
                          aria-label="expand"
                        >
                          {expanded === inv.id ? (
                            <BsChevronDown />
                          ) : (
                            <BsChevronRight />
                          )}
                        </Button>
                      </td>
                      <td>{inv.id}</td>
                      <td className="fw-semibold">{inv.number}</td>
                      <td>{inv.customer}</td>
                      <td>{inv.invoiceDate?.slice(0, 10) || "—"}</td>
                      <td>
                        <Badge
                          bg={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "sent"
                              ? "info"
                              : inv.status === "void"
                              ? "danger"
                              : "secondary"
                          }
                          className="text-capitalize"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        $
                        {num(inv.total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="d-flex flex-wrap gap-2">
                        {can(role, "update", "invoices") && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openEdit(inv)}
                          >
                            Edit
                          </Button>
                        )}
                        {can(role, "delete", "invoices") && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => del(inv.id)}
                          >
                            Delete
                          </Button>
                        )}
                        {/* Status transitions */}
                        {can(role, "update", "invoices") &&
                          inv.status === "draft" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Send invoice</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={async () => {
                                  await transition({
                                    id: inv.id,
                                    action: "send",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Send
                              </Button>
                            </OverlayTrigger>
                          )}
                        {can(role, "update", "invoices") &&
                          inv.status !== "paid" &&
                          inv.status !== "void" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Mark as paid</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={async () => {
                                  await transition({
                                    id: inv.id,
                                    action: "pay",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Mark Paid
                              </Button>
                            </OverlayTrigger>
                          )}
                        {can(role, "update", "invoices") &&
                          inv.status !== "void" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Void invoice</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={async () => {
                                  await transition({
                                    id: inv.id,
                                    action: "void",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Void
                              </Button>
                            </OverlayTrigger>
                          )}
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => exportInvoicePDF(inv)}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded items */}
                    {expanded === inv.id && (
                      <tr key={`exp-${inv.id}`}>
                        <td></td>
                        <td colSpan={7}>
                          <Table size="sm" bordered className="mb-2">
                            <thead>
                              <tr>
                                <th>Description</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(inv.items || []).map((it: InvoiceItem) => (
                                <tr key={it.id}>
                                  <td>{it.description}</td>
                                  <td className="text-end">{num(it.qty)}</td>
                                  <td className="text-end">
                                    ${num(it.price).toFixed(2)}
                                  </td>
                                  <td className="text-end">
                                    ${(num(it.qty) * num(it.price)).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              {(!inv.items || inv.items.length === 0) && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="text-center text-muted"
                                  >
                                    No items
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                          <div className="d-flex justify-content-end gap-4">
                            <div>
                              Subtotal:{" "}
                              <strong>${num(inv.subtotal).toFixed(2)}</strong>
                            </div>
                            <div>
                              Tax: <strong>${num(inv.tax).toFixed(2)}</strong>
                            </div>
                            <div>
                              Total:{" "}
                              <strong>${num(inv.total).toFixed(2)}</strong>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No invoices
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
                <Button
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
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

      {/* ------------------------------ Modal CRUD ------------------------------ */}
      <ModalForm
        title={editing ? "Edit Invoice" : "New Invoice"}
        show={show}
        onHide={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button form="inv-form" type="submit" disabled={isSubmitting}>
              {editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Form
          id="inv-form"
          onSubmit={handleSubmit(onSubmit)}
          className="d-grid gap-3"
        >
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Customer</Form.Label>
                <Form.Control
                  {...register("customer")}
                  isInvalid={!!errors.customer}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.customer?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control type="date" {...register("invoiceDate")} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Due Date</Form.Label>
                <Form.Control type="date" {...register("dueDate")} />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>CompanyId (optional)</Form.Label>
                <Form.Control {...register("CompanyId")} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Invoice # (optional)</Form.Label>
                <Form.Control
                  placeholder="Auto if empty"
                  {...register("number")}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Tax</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  {...register("tax", { valueAsNumber: true })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Subtotal</Form.Label>
                <Form.Control value={subtotal.toFixed(2)} readOnly />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Total</Form.Label>
                <Form.Control value={total.toFixed(2)} readOnly />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-semibold">Items</div>
            <Button
              size="sm"
              onClick={() => append({ description: "", qty: 1, price: 0 })}
            >
              + Add Line
            </Button>
          </div>

          <div className="d-grid gap-2">
            {fields.map((f, idx) => (
              <Row key={f.id} className="g-2 align-items-end">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      {...register(`items.${idx}.description` as const)}
                      isInvalid={!!errors.items?.[idx]?.description}
                    />
                    <Form.Control.Feedback type="invalid">
                      {(errors.items?.[idx]?.description?.message as any) || ""}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Qty</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      {...register(`items.${idx}.qty` as const, {
                        valueAsNumber: true,
                      })}
                      isInvalid={!!errors.items?.[idx]?.qty}
                    />
                    <Form.Control.Feedback type="invalid">
                      {(errors.items?.[idx]?.qty?.message as any) || ""}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Price</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      step="0.01"
                      {...register(`items.${idx}.price` as const, {
                        valueAsNumber: true,
                      })}
                      isInvalid={!!errors.items?.[idx]?.price}
                    />
                    <Form.Control.Feedback type="invalid">
                      {(errors.items?.[idx]?.price?.message as any) || ""}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={1} className="text-end">
                  <div className="small text-muted">Line</div>
                  <div className="fw-semibold">
                    $
                    {(
                      num(watch(`items.${idx}.qty`)) *
                      num(watch(`items.${idx}.price`))
                    ).toFixed(2)}
                  </div>
                </Col>
                <Col md="auto">
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
          </div>
          {typeof errors.items?.message === "string" && (
            <div className="text-danger">{errors.items?.message}</div>
          )}
        </Form>
      </ModalForm>
    </Row>
  );
}
