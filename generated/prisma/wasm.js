
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AssignmentsScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  course_id: 'course_id',
  due_date: 'due_date',
  max_score: 'max_score',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BatchesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  start_date: 'start_date',
  end_date: 'end_date',
  fee: 'fee',
  is_active: 'is_active',
  created_at: 'created_at',
  trainer_id: 'trainer_id',
  capacity: 'capacity',
  updated_at: 'updated_at',
  tenant_id: 'tenant_id'
};

exports.Prisma.Code_snippetsScalarFieldEnum = {
  id: 'id',
  title: 'title',
  language: 'language',
  code: 'code',
  description: 'description',
  user_id: 'user_id',
  course_id: 'course_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CoursesScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  duration: 'duration',
  batch_id: 'batch_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  tenant_id: 'tenant_id'
};

exports.Prisma.Follow_up_commentsScalarFieldEnum = {
  id: 'id',
  follow_up_id: 'follow_up_id',
  comment: 'comment',
  created_by: 'created_by',
  created_at: 'created_at'
};

exports.Prisma.Follow_upsScalarFieldEnum = {
  id: 'id',
  lead_id: 'lead_id',
  follow_up_date: 'follow_up_date',
  comments: 'comments',
  status: 'status',
  assigned_to: 'assigned_to',
  created_by: 'created_by',
  is_completed: 'is_completed',
  completed_at: 'completed_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  type: 'type',
  next_follow_up_date: 'next_follow_up_date',
  tenant_id: 'tenant_id'
};

exports.Prisma.LeadsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  source: 'source',
  status: 'status',
  notes: 'notes',
  assigned_to: 'assigned_to',
  created_at: 'created_at',
  updated_at: 'updated_at',
  course: 'course',
  tenant_id: 'tenant_id'
};

exports.Prisma.Lesson_plansScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  title: 'title',
  content: 'content',
  week_number: 'week_number',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Password_reset_tokensScalarFieldEnum = {
  id: 'id',
  token: 'token',
  user_id: 'user_id',
  expires_at: 'expires_at',
  created_at: 'created_at',
  is_used: 'is_used',
  tenant_id: 'tenant_id'
};

exports.Prisma.PaymentsScalarFieldEnum = {
  id: 'id',
  student_id: 'student_id',
  amount: 'amount',
  payment_date: 'payment_date',
  payment_method: 'payment_method',
  receipt_number: 'receipt_number',
  transaction_id: 'transaction_id',
  notes: 'notes',
  created_at: 'created_at',
  reference: 'reference',
  next_payment_due_date: 'next_payment_due_date',
  tenant_id: 'tenant_id',
  status: 'status'
};

exports.Prisma.SessionsScalarFieldEnum = {
  sid: 'sid',
  sess: 'sess',
  expire: 'expire'
};

exports.Prisma.SettingsScalarFieldEnum = {
  id: 'id',
  tenant_id: 'tenant_id',
  key: 'key',
  value: 'value',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.StudentsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  parent_mobile: 'parent_mobile',
  batch_id: 'batch_id',
  enrollment_date: 'enrollment_date',
  total_fee: 'total_fee',
  fee_paid: 'fee_paid',
  fee_due: 'fee_due',
  is_active: 'is_active',
  converted_from_lead_id: 'converted_from_lead_id',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  tenant_id: 'tenant_id',
  user_id: 'user_id'
};

exports.Prisma.TenantsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  subdomain: 'subdomain',
  active: 'active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  email: 'email',
  name: 'name',
  role: 'role',
  created_at: 'created_at',
  phone: 'phone',
  specialization: 'specialization',
  bio: 'bio',
  status: 'status',
  tenant_id: 'tenant_id'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.lead_status = exports.$Enums.lead_status = {
  new: 'new',
  contacted: 'contacted',
  qualified: 'qualified',
  dropped: 'dropped',
  converted: 'converted'
};

exports.payment_method = exports.$Enums.payment_method = {
  cash: 'cash',
  check: 'check',
  bank_transfer: 'bank_transfer',
  online: 'online',
  other: 'other'
};

exports.user_role = exports.$Enums.user_role = {
  admin: 'admin',
  manager: 'manager',
  trainer: 'trainer',
  student: 'student'
};

exports.Prisma.ModelName = {
  assignments: 'assignments',
  batches: 'batches',
  code_snippets: 'code_snippets',
  courses: 'courses',
  follow_up_comments: 'follow_up_comments',
  follow_ups: 'follow_ups',
  leads: 'leads',
  lesson_plans: 'lesson_plans',
  password_reset_tokens: 'password_reset_tokens',
  payments: 'payments',
  sessions: 'sessions',
  settings: 'settings',
  students: 'students',
  tenants: 'tenants',
  users: 'users'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
