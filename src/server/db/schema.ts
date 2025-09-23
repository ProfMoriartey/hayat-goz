// // Example model schema from the Drizzle docs
// // https://orm.drizzle.team/docs/sql-schema-declaration

// import { sql } from "drizzle-orm";
// import { index, pgTableCreator } from "drizzle-orm/pg-core";

// /**
//  * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
//  * database instance for multiple projects.
//  *
//  * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
//  */
// export const createTable = pgTableCreator((name) => `hayat-goz_${name}`);

// export const posts = createTable(
//   "post",
//   (d) => ({
//     id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
//     name: d.varchar({ length: 256 }),
//     createdAt: d
//       .timestamp({ withTimezone: true })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
//   }),
//   (t) => [index("name_idx").on(t.name)],
// );

import {
pgTable,
uuid,
text,
integer,
timestamp,
boolean,
varchar,
pgEnum,
time,
index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


export const roleEnum = pgEnum("role", ["ADMIN", "DOCTOR", "RECEPTION", "PATIENT"]);

export const users = pgTable("users", {
id: uuid("id").defaultRandom().primaryKey(),
role: roleEnum("role").notNull().default("PATIENT"),
email: varchar("email", { length: 255 }).notNull().unique(),
name: varchar("name", { length: 120 }),
phone: varchar("phone", { length: 40 }),
preferredLanguage: varchar("preferred_language", { length: 5 }).default("tr"), // tr/en/ar
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const doctors = pgTable("doctors", {
id: uuid("id").defaultRandom().primaryKey(),
userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
displayName: varchar("display_name", { length: 120 }).notNull(),
specialties: text("specialties"), // comma-separated or JSON in future
languages: text("languages"), // e.g., "tr,en,ar"
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patients = pgTable("patients", {
id: uuid("id").defaultRandom().primaryKey(),
userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
fullName: varchar("full_name", { length: 120 }).notNull(),
phone: varchar("phone", { length: 40 }).notNull(),
email: varchar("email", { length: 255 }),
dob: timestamp("dob", { withTimezone: true }),
notes: text("notes"),
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


export const appointmentTypes = pgTable("appointment_types", {
id: uuid("id").defaultRandom().primaryKey(),
name: varchar("name", { length: 120 }).notNull(), // e.g., General Eye Exam
durationMin: integer("duration_min").notNull().default(20), // minutes
bufferBeforeMin: integer("buffer_before_min").notNull().default(0),
bufferAfterMin: integer("buffer_after_min").notNull().default(5),
priceMinorUnit: integer("price_minor_unit"), // optional (e.g., 20000 = 200.00 TRY)
currency: varchar("currency", { length: 3 }).default("TRY"),
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Weekly availability template per doctor
export const availabilities = pgTable(
"availabilities",
{
id: uuid("id").defaultRandom().primaryKey(),
doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday ... 6=Saturday
startTime: time("start_time", { withTimezone: false }).notNull(), // e.g., 09:00
endTime: time("end_time", { withTimezone: false }).notNull(), // e.g., 13:00
slotSizeMin: integer("slot_size_min").notNull().default(10), // base granularity
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
},
(t) => ({
doctorDowIdx: index("avail_doctor_dow_idx").on(t.doctorId, t.dayOfWeek),
})
);

// One-off exception day per doctor (override or closed)
export const availabilityExceptions = pgTable(
"availability_exceptions",
{
id: uuid("id").defaultRandom().primaryKey(),
doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
date: timestamp("date", { withTimezone: true }).notNull(), // use date-only at midnight UTC
isClosed: boolean("is_closed").notNull().default(false),
// optional override windows for that day, comma-separated like "09:00-12:00,14:00-17:00"
windows: varchar("windows", { length: 255 }),
note: varchar("note", { length: 255 }),
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
},
(t) => ({
doctorDateIdx: index("avail_exc_doctor_date_idx").on(t.doctorId, t.date),
})
);

export const appointments = pgTable(
"appointments",
{
id: uuid("id").defaultRandom().primaryKey(),
patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
appointmentTypeId: uuid("appointment_type_id").notNull().references(() => appointmentTypes.id),
startTime: timestamp("start_time", { withTimezone: true }).notNull(), // UTC
endTime: timestamp("end_time", { withTimezone: true }).notNull(), // UTC
status: varchar("status", { length: 20 }).notNull().default("CONFIRMED"), // CONFIRMED/CANCELLED/NO_SHOW
notes: text("notes"),
createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
},
(t) => ({
doctorStartIdx: index("appt_doctor_start_idx").on(t.doctorId, t.startTime),
patientStartIdx: index("appt_patient_start_idx").on(t.patientId, t.startTime),
})
);