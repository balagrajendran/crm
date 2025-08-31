// src/pages/PurchaseOrders.tsx
import { useEffect, useMemo, useState } from "react";
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
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useTransitionPurchaseOrderMutation,
  PurchaseOrder,
  PurchaseOrderItem,
  api,
} from "../../services/api";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ModalForm from "../../components/ModalForm";
import { useAppDispatch } from "../../app/hooks";
import { can, Role } from "../../utils/rbac";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import ReceivePO from "../../components/ReceivePO";
import { exportPurchaseOrderPDF } from "../../utils/poPdf";
import siteLogo from '../../assets/logo.png'

/* ----------------------------- Validation schema ---------------------------- */

const itemSchema = z.object({
  product: z.string().min(1, "Product required"),
  qty: z.coerce.number().int().min(1, "Qty ≥ 1"),
  price: z.coerce.number().min(0, "Price ≥ 0"),
  itemNo: z.coerce.number().optional(),
  materialCode: z.string().optional(),
  description: z.string().optional(),

  qtyOrdered: z.coerce.number().min(0, "Qty ≥ 0").default(0),
  // qtyRequisitioned: z.coerce.number().optional(),
  // qtyReceived: z.coerce.number().optional(),
  // qtyInvoiced: z.coerce.number().optional(),

  uom: z.string().optional(),
  deliveryDate: z.string().optional(),
  netPrice: z.coerce.number().min(0, "Price ≥ 0").default(0),

  storageLocation: z.string().optional(),
  prReference: z.string().optional(),
  poReference: z.string().optional(),
});

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const poSchema = z.object({
  // number is auto-created by server; allow optional to edit
  number: z.string().optional(),
  vendor: z.string().min(2, "Vendor required"),
  orderDate: z.string().optional(),
  status: z.enum(["draft", "approved", "received", "cancelled"]),
  total: z.coerce.number().min(0, "Total ≥ 0").optional(),
  // CompanyId: z.preprocess(
  //   (v) => (v === "" ? undefined : Number(v)),
  //   z.number().optional()
  // ),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  // NEW header fields
  documentDate: z.string().optional(),
  supplierCode: z.string().optional(),
  currency: z.string().optional(),
  paymentTerms: z.string().optional(),
  plantLocation: z.string().optional(),
});

type FormValues = z.infer<typeof poSchema>;

/* ---------------------------------- View ----------------------------------- */

function getBase64(imgPath: string, callback: (base64: string) => void) {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    const reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result as string);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', imgPath);
  xhr.responseType = 'blob';
  xhr.send();
}

export default function PurchaseOrders() {
  /* query + mutations */
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);

  const [showReceive, setShowReceive] = useState(false);
  const [poToReceive, setPoToReceive] = useState<any | null>(null);


  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    getBase64(siteLogo, setLogo);
  }, []);

  const { data, refetch, isFetching } = useGetPurchaseOrdersQuery({
    page,
    limit,
    search,
  });
  const [createIt] = useCreatePurchaseOrderMutation();
  const [updateIt] = useUpdatePurchaseOrderMutation();
  const [deleteIt] = useDeletePurchaseOrderMutation();
  const [transition] = useTransitionPurchaseOrderMutation();
  const d = useAppDispatch();

  /* auth/role */
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null") as any,
    []
  );
  const role = (user?.role || "viewer") as Role;

  /* modal state */
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);

  /* expandable rows */
  const [expanded, setExpanded] = useState<number | null>(null);

  /* form */
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendor: "",
      orderDate: "",
      status: "draft",
      total: 0,
      items: [
        {
          product: "",
          qty: 1,
          price: 0,
          itemNo: 1,
          materialCode: "",
          description: "",
          qtyOrdered: 1,
          netPrice: 0,
          uom: "EA",
          deliveryDate: "",
          storageLocation: "",
          prReference: "",
          poReference: "",
        },
      ],
      documentDate: "",
      supplierCode: "",
      currency: "",
      paymentTerms: "",
      plantLocation: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const items = watch("items");
  const calcTotal = useMemo(
    () =>
      (items || []).reduce(
        (sum, it) =>
          sum + Number(it.qtyOrdered ?? 0) * Number(it.netPrice ?? 0),
        0
      ),
    [items]
  );

  useEffect(() => {
    // keep total field synced (view-only; server will trust total we send)
    // if you want to make total non-editable, don't register an input for it
  }, [calcTotal]);

  function openAdd() {
    setEditing(null);
    reset({
      vendor: "",
      orderDate: "",
      status: "draft",
      total: 0,
      items: [
        {
          product: "",
          qty: 1,
          price: 0,
          itemNo: 1,
          materialCode: "",
          description: "",
          qtyOrdered: 1,
          netPrice: 0,
          uom: "EA",
          deliveryDate: "",
          storageLocation: "",
          prReference: "",
          poReference: "",
        },
      ],
      documentDate: "",
      supplierCode: "",
      currency: "",
      paymentTerms: "",
      plantLocation: "",
    });
    setShow(true);
  }

  function openEdit(po: PurchaseOrder) {
    setEditing(po);
    reset({
      number: po.number,
      vendor: po.vendor,
      orderDate: po.orderDate?.slice(0, 10),
      status: po.status,
      total: po.total,
      //CompanyId: po.CompanyId,
      items: (po.items || []).map((it) => ({
        product: it.product,
        qty: it.qty,
        price: it.price,
        itemNo: it.itemNo,
        //materialCode: it.materialCode,
        //description: it.description,
        qtyOrdered: it.qtyOrdered,
        // qtyRequisitioned: it.qtyRequisitioned,
        // qtyReceived: it.qtyReceived,
        // qtyInvoiced: it.qtyInvoiced,
        uom: it.uom,
        deliveryDate: it.deliveryDate?.slice(0, 10),
        netPrice: it.netPrice,
        storageLocation: it.storageLocation,
        prReference: it.prReference,
        poReference: it.poReference,
      })),
      documentDate: po.documentDate?.slice(0, 10),
      supplierCode: po.supplierCode || "",
      currency: po.currency || "",
      paymentTerms: po.paymentTerms || "",
      plantLocation: po.plantLocation || "",
    });
    if (!po.items || po.items.length === 0)
      replace([
        {
          product: "",
          qty: 1,
          price: 0,
          itemNo: 1,
          materialCode: "",
          description: "",
          qtyOrdered: 1,
          netPrice: 0,
          uom: "EA",
          deliveryDate: "",
          storageLocation: "",
          prReference: "",
          poReference: "",
        },
      ]);
    setShow(true);
  }

  const close = () => setShow(false);

  async function onSubmit(v: FormValues) {
    // ensure total = sum(items)
    const payload: FormValues = { ...v, total: calcTotal };

    if (editing) {
      const patch = d(
        api.util.updateQueryData(
          "getPurchaseOrders",
          { page, limit, search },
          (draft: any) => {
            const i = draft.data.findIndex(
              (x: PurchaseOrder) => x.id === editing.id
            );
            if (i > -1)
              draft.data[i] = { ...draft.data[i], ...payload, items: v.items };
          }
        )
      );
      try {
        await updateIt({ id: editing.id, ...(payload as any) }).unwrap();
      } catch {
        patch.undo();
      }
    } else {
      // optimistic add
      const tempId = Math.floor(Math.random() * -1e9);
      const patch = d(
        api.util.updateQueryData(
          "getPurchaseOrders",
          { page, limit, search },
          (draft: any) => {
            draft.data.unshift({
              id: tempId,
              number: "PO-PENDING",
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
        "getPurchaseOrders",
        { page, limit, search },
        (draft: any) => {
          draft.data = draft.data.filter((x: PurchaseOrder) => x.id !== id);
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

  const itemsData = data?.data ?? [];
  const totalRows = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card>
          <Card.Body className="d-flex flex-wrap gap-2 align-items-center">
            <Form.Control
              placeholder="Search PO#, vendor, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <Button onClick={() => setPage(1)} disabled={isFetching}>
              Search
            </Button>
            {can(role, "create", "purchaseOrders") && (
              <Button variant="success" onClick={openAdd}>
                Create PO
              </Button>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={12}>
        <Card>
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center">
              <span>Purchase Orders</span>
              <small className="text-muted">
                {isFetching ? "Loading…" : null}
              </small>
            </Card.Title>

            {showReceive && (
              <ReceivePO
                show={showReceive}
                onHide={() => setShowReceive(false)}
                po={poToReceive}
              />
            )}
            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>ID</th>
                  <th>Document #</th>
                  <th>Supplier Code</th>
                  <th>Document Date</th>
                  <th>Status</th>
                  <th className="text-end">Total</th>
                  {/* <th>Doc Date</th>
                  <th>Supplier Code</th>
                  <th>Currency</th> */}
                  <th>Plant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemsData.map((po: PurchaseOrder) => (
                  <>
                    <tr key={po.id}>
                      <td>
                        <Button
                          size="sm"
                          variant="light"
                          className="p-0"
                          onClick={() =>
                            setExpanded(expanded === po.id ? null : po.id)
                          }
                          aria-label="expand"
                        >
                          {expanded === po.id ? (
                            <BsChevronDown />
                          ) : (
                            <BsChevronRight />
                          )}
                        </Button>
                      </td>
                      <td>{po.id}</td>
                      <td className="fw-semibold">{po.number}</td>
                      <td>{po.vendor}</td>
                      <td>{po.documentDate?.slice(0, 10) || "—"}</td>
                      <td>
                        <Badge
                          bg={
                            po.status === "approved"
                              ? "info"
                              : po.status === "received"
                              ? "success"
                              : po.status === "cancelled"
                              ? "danger"
                              : "secondary"
                          }
                          className="text-capitalize"
                        >
                          {po.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        $
                        {num(po.total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      {/* <td>{po.documentDate?.slice(0, 10) || "—"}</td>
                      <td>{po.supplierCode || "—"}</td>
                      <td>{po.currency || "—"}</td> */}
                      <td className="text-truncate" style={{ maxWidth: 160 }}>
                        {po.plantLocation || "—"}
                      </td>

                      <td className="d-flex flex-wrap gap-2">
                        {can(role, "update", "purchaseOrders") && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openEdit(po)}
                          >
                            Edit
                          </Button>
                        )}
                        {can(role, "delete", "purchaseOrders") && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => del(po.id)}
                          >
                            Delete
                          </Button>
                        )}

                        {can(role, "update", "purchaseOrders") &&
                          (po.status === "approved" ||
                            po.status === "received") && (
                            // <Button
                            //   size="sm"
                            //   variant="outline-success"
                            //   onClick={() => setReceiving(po)}
                            // >
                            //   GRN
                            // </Button>
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => {
                                setPoToReceive(po);
                                setShowReceive(true);
                              }}
                            >
                              GRN
                            </Button>
                          )}

                        {/* Status transitions */}
                        {can(role, "update", "purchaseOrders") &&
                          po.status === "draft" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Mark as approved</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={async () => {
                                  await transition({
                                    id: po.id,
                                    action: "approve",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Approve
                              </Button>
                            </OverlayTrigger>
                          )}
                        {can(role, "update", "purchaseOrders") &&
                          po.status === "approved" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Mark as received</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={async () => {
                                  await transition({
                                    id: po.id,
                                    action: "receive",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Receive
                              </Button>
                            </OverlayTrigger>
                          )}
                        {can(role, "update", "purchaseOrders") &&
                          po.status !== "cancelled" && (
                            <OverlayTrigger
                              overlay={<Tooltip>Cancel order</Tooltip>}
                            >
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={async () => {
                                  await transition({
                                    id: po.id,
                                    action: "cancel",
                                  }).unwrap();
                                  refetch();
                                }}
                              >
                                Cancel
                              </Button>
                            </OverlayTrigger>
                          )}
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => exportPurchaseOrderPDF(po, { logoDataUrl: logo ?? undefined })}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded line items */}
                    {expanded === po.id && (
                      <tr key={`exp-${po.id}`}>
                        <td></td>
                        <td colSpan={7}>
                          <Table size="sm" bordered className="mb-2">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(po.items || []).map((it) => {
                                const qty = num(it.qtyOrdered);
                                const price = num(it.netPrice);
                                return (
                                  <tr key={it.id}>
                                    <td>{it.product}</td>
                                    <td className="text-end">{qty}</td>
                                    <td className="text-end">
                                      ${price.toFixed(2)}
                                    </td>
                                    <td className="text-end">
                                      ${(qty * price).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {(!po.items || po.items.length === 0) && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="text-muted text-center"
                                  >
                                    No items
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {itemsData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No purchase orders found
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

      {/* --------------------------- Create/Edit Modal --------------------------- */}
      <ModalForm
        title={editing ? "Edit Purchase Order" : "Create Purchase Order"}
        show={show}
        onHide={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button form="po-form" type="submit" disabled={isSubmitting}>
              {editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Form
          id="po-form"
          onSubmit={handleSubmit(onSubmit)}
          className="d-grid gap-3"
        >
          {/* --- Header (common) --- */}
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Document NO (optional)</Form.Label>
                <Form.Control
                  placeholder="Auto if empty"
                  {...register("number")}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Document Date</Form.Label>
                <Form.Control type="date" {...register("documentDate")} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Supplier Code</Form.Label>
                <Form.Control
                  {...register("vendor")}
                  isInvalid={!!errors.vendor}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.vendor?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* <Col md={3}>
              <Form.Group>
                <Form.Label>Supplier Code</Form.Label>
                <Form.Control {...register("supplierCode")} />
              </Form.Group>
            </Col> */}

            {/* <Col md={3}>
              <Form.Group>
                <Form.Label>CompanyId (optional)</Form.Label>
                <Form.Control {...register("CompanyId")} />
              </Form.Group>
            </Col> */}

            <Col md={3}>
              <Form.Group>
                <Form.Label>Payment Terms</Form.Label>
                <Form.Control
                  placeholder="e.g. Net 30"
                  {...register("paymentTerms")}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Plant / Receiving Location</Form.Label>
                <Form.Control {...register("plantLocation")} />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Control
                  placeholder="e.g. USD, INR"
                  {...register("currency")}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select {...register("status")}>
                  {["draft", "approved", "received", "cancelled"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Total</Form.Label>
                <Form.Control value={calcTotal.toFixed(2)} readOnly />
                <div className="form-text">Auto from items</div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            {/* <Col md={3}>
              <Form.Group>
                <Form.Label>Order Date</Form.Label>
                <Form.Control type="date" {...register("orderDate")} />
              </Form.Group>
            </Col> */}
          </Row>

          <Row className="g-3"></Row>

          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-semibold">Items</div>
            <Button
              size="sm"
              onClick={() =>
                append({
                  product: "",
                  qty: 1,
                  price: 0,
                  itemNo: 1,
                  materialCode: "",
                  description: "",
                  qtyOrdered: 1,
                  netPrice: 0,
                  uom: "EA",
                  deliveryDate: "",
                  storageLocation: "",
                  prReference: "",
                  poReference: "",
                })
              }
            >
              + Add Item
            </Button>
          </div>

          <div className="d-grid gap-2">
            {fields.map((f, idx) => (
              <Row
                key={f.id}
                className="g-2 align-items-end border rounded p-2"
              >
                <Row className="g-3">
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Item #</Form.Label>
                      <Form.Control
                        type="number"
                        {...register(`items.${idx}.itemNo` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Material</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.product` as const)}
                        isInvalid={!!errors.items?.[idx]?.product}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.items?.[idx]?.product?.message as any}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* <Col md={2}>
                    <Form.Group>
                      <Form.Label>Material</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.materialCode` as const)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.description` as const)}
                      />
                    </Form.Group>
                  </Col> */}

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>UoM</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.uom` as const)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Delivery Date</Form.Label>
                      <Form.Control
                        type="date"
                        {...register(`items.${idx}.deliveryDate` as const)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Qty</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        {...register(`items.${idx}.qtyOrdered` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Net Price</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min={0}
                        {...register(`items.${idx}.netPrice` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col>
                  {/* <Col md={2}>
                    <Form.Group>
                      <Form.Label>Req Qty</Form.Label>
                      <Form.Control
                        type="number"
                        {...register(`items.${idx}.qtyRequisitioned` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Received</Form.Label>
                      <Form.Control
                        type="number"
                        {...register(`items.${idx}.qtyReceived` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Invoiced</Form.Label>
                      <Form.Control
                        type="number"
                        {...register(`items.${idx}.qtyInvoiced` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </Form.Group>
                  </Col> */}
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Storage Location</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.storageLocation` as const)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>PR Ref</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.prReference` as const)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>PO Ref</Form.Label>
                      <Form.Control
                        {...register(`items.${idx}.poReference` as const)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md="auto" className="text-end">
                    <div className="small text-muted">Line</div>
                    <div className="fw-semibold">
                      ₹
                      {(
                        (watch(`items.${idx}.qtyOrdered`) ?? 0) *
                          (watch(`items.${idx}.netPrice`) ?? 0) || 0
                      ).toFixed(2)}
                    </div>
                  </Col>
                </Row>
                <Row className="g-3">
                  <Col md="auto" className="d-flex align-items-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => remove(idx)}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
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
