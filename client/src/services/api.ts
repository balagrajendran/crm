import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("content-type", "application/json");
    return headers;
  },
  credentials: "include",
});

type Pagination<T> = { data: T[]; total: number };

export interface SupplierSuggestion {
  code: string;
  name?: string;
}

export interface Company {
  id: number;
  name: string;
  domain?: string;
  phone?: string;
  city?: string;
  country?: string;
}
export interface Contact {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  CompanyId?: number;
}
export interface Deal {
  id: number;
  title: string;
  amount: number;
  stage: "new" | "qualified" | "proposal" | "won" | "lost";
  CompanyId?: number;
  ContactId?: number;
}
export interface Activity {
  id: number;
  type: "call" | "email" | "meeting" | "task";
  subject: string;
  dueDate?: string;
  status: "todo" | "done";
  CompanyId?: number;
  ContactId?: number;
  DealId?: number;
}

export interface PurchaseOrderItem {
  id?: number;

  // legacy
  product?: string;
  qty?: number;
  price?: number;

  // NEW
  itemNo?: number;
  materialCode?: string;
  description?: string;

  qtyRequisitioned?: number;
  qtyOrdered?: number;
  qtyReceived?: number;
  qtyInvoiced?: number;

  uom?: string;
  deliveryDate?: string; // 'YYYY-MM-DD'
  netPrice?: number;

  storageLocation?: string;
  prReference?: string;
  poReference?: string;

  PurchaseOrderId?: number;
}

export interface PurchaseOrder {
  id: number;
  number: string;
  vendor: string;
  orderDate?: string;
  status: "draft" | "approved" | "received" | "cancelled";
  total: number;
  documentDate?: string; // 'YYYY-MM-DD'
  supplierCode?: string;
  currency?: string;
  paymentTerms?: string;
  plantLocation?: string;
  CompanyId?: number;
  items?: PurchaseOrderItem[];
}

export interface InvoiceItem {
  id: number;
  description: string;
  qty: number;
  price: number;
  InvoiceId?: number;
}
export interface Invoice {
  id: number;
  number: string;
  customer: string;
  invoiceDate?: string;
  dueDate?: string;
  status: "draft" | "sent" | "paid" | "void";
  subtotal: number;
  tax: number;
  total: number;
  CompanyId?: number;
  items?: InvoiceItem[];
}

export interface GRNItem {
  id: number;
  GRNId: number;
  PurchaseOrderItemId: number;
  product: string;
  qtyOrdered: number;
  qtyReceived: number;
}
export interface GRN {
  id: number;
  number: string;
  PurchaseOrderId: number;
  receivedDate?: string;
  status: "draft" | "approved" | "cancelled";
  notes?: string;
  items?: GRNItem[];
}

export interface CreateGRNItem {
  PurchaseOrderItemId: number;
  receiveQty?: number;
  acceptedQty?: number;
  rejectedQty?: number;
}
export interface CreateGRNBody {
  PurchaseOrderId: number;
  receivedDate?: string;
  notes?: string;
  items: CreateGRNItem[];
}

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Company",
    "Contact",
    "Deal",
    "Activity",
    "Dashboard",
    "PurchaseOrder",
    "Invoice",
    "GRN",
  ],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<
      any,
      { name: string; email: string; password: string }
    >({
      query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data?.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      },
    }),
    login: builder.mutation<any, { email: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data?.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      },
    }),
    me: builder.query<any, void>({ query: () => ({ url: "/api/auth/me" }) }),

    // Dashboard
    dashboard: builder.query<{ counts: any; revenueWon: number }, void>({
      query: () => ({ url: "/api/dashboard" }),
      providesTags: ["Dashboard"],
    }),

    // Companies
    getCompanies: builder.query<
      Pagination<Company>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) => ({
        url: `/api/companies?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({
                type: "Company" as const,
                id: c.id,
              })),
              { type: "Company" as const, id: "LIST" },
            ]
          : [{ type: "Company" as const, id: "LIST" }],
    }),
    createCompany: builder.mutation<Company, Partial<Company>>({
      query: (body) => ({ url: "/api/companies", method: "POST", body }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
    updateCompany: builder.mutation<Company, Partial<Company> & { id: number }>(
      {
        query: ({ id, ...body }) => ({
          url: `/api/companies/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, a) => [
          { type: "Company", id: a.id },
          { type: "Company", id: "LIST" },
        ],
      }
    ),
    deleteCompany: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/companies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),

    // Contacts
    getContacts: builder.query<
      Pagination<Contact>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) => ({
        url: `/api/contacts?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({
                type: "Contact" as const,
                id: c.id,
              })),
              { type: "Contact" as const, id: "LIST" },
            ]
          : [{ type: "Contact" as const, id: "LIST" }],
    }),
    createContact: builder.mutation<Contact, Partial<Contact>>({
      query: (body) => ({ url: "/api/contacts", method: "POST", body }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),
    updateContact: builder.mutation<Contact, Partial<Contact> & { id: number }>(
      {
        query: ({ id, ...body }) => ({
          url: `/api/contacts/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, a) => [
          { type: "Contact", id: a.id },
          { type: "Contact", id: "LIST" },
        ],
      }
    ),
    deleteContact: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/contacts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),

    // Deals
    getDeals: builder.query<
      Pagination<Deal>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 100, search = "" }) => ({
        url: `/api/deals?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({ type: "Deal" as const, id: c.id })),
              { type: "Deal" as const, id: "LIST" },
            ]
          : [{ type: "Deal" as const, id: "LIST" }],
    }),
    createDeal: builder.mutation<Deal, Partial<Deal>>({
      query: (body) => ({ url: "/api/deals", method: "POST", body }),
      invalidatesTags: [
        { type: "Deal", id: "LIST" },
        { type: "Dashboard", id: "*" },
      ],
    }),
    updateDeal: builder.mutation<Deal, Partial<Deal> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/api/deals/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, a) => [
        { type: "Deal", id: a.id },
        { type: "Deal", id: "LIST" },
        { type: "Dashboard", id: "*" },
      ],
    }),
    deleteDeal: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/deals/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Deal", id: "LIST" },
        { type: "Dashboard", id: "*" },
      ],
    }),

    // Activities
    getActivities: builder.query<
      Pagination<Activity>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) => ({
        url: `/api/activities?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((c) => ({
                type: "Activity" as const,
                id: c.id,
              })),
              { type: "Activity" as const, id: "LIST" },
            ]
          : [{ type: "Activity" as const, id: "LIST" }],
    }),
    createActivity: builder.mutation<Activity, Partial<Activity>>({
      query: (body) => ({ url: "/api/activities", method: "POST", body }),
      invalidatesTags: [{ type: "Activity", id: "LIST" }],
    }),
    updateActivity: builder.mutation<
      Activity,
      Partial<Activity> & { id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/activities/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, a) => [
        { type: "Activity", id: a.id },
        { type: "Activity", id: "LIST" },
      ],
    }),
    deleteActivity: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/activities/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Activity", id: "LIST" }],
    }),
    getPurchaseOrders: builder.query<
      { data: PurchaseOrder[]; total: number },
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) => ({
        url: `/api/purchase-orders?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      }),
      providesTags: (res) =>
        res?.data
          ? [
              ...res.data.map((p) => ({
                type: "PurchaseOrder" as const,
                id: p.id,
              })),
              { type: "PurchaseOrder" as const, id: "LIST" },
            ]
          : [{ type: "PurchaseOrder" as const, id: "LIST" }],
    }),
    createPurchaseOrder: builder.mutation<
      PurchaseOrder,
      Partial<PurchaseOrder>
    >({
      query: (body) => ({ url: "/api/purchase-orders", method: "POST", body }),
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),
    updatePurchaseOrder: builder.mutation<
      PurchaseOrder,
      Partial<PurchaseOrder> & { id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/purchase-orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, a) => [
        { type: "PurchaseOrder", id: a.id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),
    deletePurchaseOrder: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/purchase-orders/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),
    transitionPurchaseOrder: builder.mutation<
      PurchaseOrder,
      { id: number; action: "approve" | "receive" | "cancel" }
    >({
      query: ({ id, action }) => ({
        url: `/api/purchase-orders/${id}/transition`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: (r, e, a) => [
        { type: "PurchaseOrder", id: a.id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),
    getInvoices: builder.query<
      { data: Invoice[]; total: number },
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/api/invoices?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      providesTags: (res) =>
        res?.data
          ? [
              ...res.data.map((i) => ({ type: "Invoice" as const, id: i.id })),
              { type: "Invoice" as const, id: "LIST" },
            ]
          : [{ type: "Invoice" as const, id: "LIST" }],
    }),
    createInvoice: builder.mutation<Invoice, Partial<Invoice>>({
      query: (body) => ({ url: "/api/invoices", method: "POST", body }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }],
    }),
    updateInvoice: builder.mutation<Invoice, Partial<Invoice> & { id: number }>(
      {
        query: ({ id, ...body }) => ({
          url: `/api/invoices/${id}`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, a) => [
          { type: "Invoice", id: a.id },
          { type: "Invoice", id: "LIST" },
        ],
      }
    ),
    deleteInvoice: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/invoices/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }],
    }),
    transitionInvoice: builder.mutation<
      Invoice,
      { id: number; action: "send" | "pay" | "void" }
    >({
      query: ({ id, action }) => ({
        url: `/api/invoices/${id}/transition`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: (r, e, a) => [
        { type: "Invoice", id: a.id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    getGRNs: builder.query<
      { data: GRN[]; total: number },
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/api/grns?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`,
      providesTags: (res) =>
        res?.data
          ? [
              ...res.data.map((x) => ({ type: "GRN" as const, id: x.id })),
              { type: "GRN", id: "LIST" },
            ]
          : [{ type: "GRN", id: "LIST" }],
    }),

    createGRN: builder.mutation<any, CreateGRNBody>({
      query: (body) => ({ url: "/api/grns", method: "POST", body }),
      invalidatesTags: [
        { type: "GRN", id: "LIST" },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    deleteGRN: builder.mutation<{ ok: boolean }, number>({
      query: (id) => ({ url: `/api/grns/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "GRN", id: "LIST" }],
    }),

    transitionGRN: builder.mutation<GRN, { id: number; action: "cancel" }>({
      query: ({ id, action }) => ({
        url: `/api/grns/${id}/transition`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: (r, e, a) => [
        { type: "GRN", id: a.id },
        { type: "GRN", id: "LIST" },
      ],
    }),

    searchSuppliers: builder.query<
      { data: SupplierSuggestion[] },
      { q: string; limit?: number }
    >({
      query: ({ q, limit = 10 }) => ({
        url: "/api/sap/suppliers",
        params: { q, limit },
      }),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useMeQuery,
  useDashboardQuery,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetDealsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
  useGetActivitiesQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useTransitionPurchaseOrderMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useTransitionInvoiceMutation,
  useGetGRNsQuery,
  useCreateGRNMutation,
  useDeleteGRNMutation,
  useTransitionGRNMutation,
  useLazySearchSuppliersQuery,
} = api;
