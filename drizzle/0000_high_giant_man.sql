CREATE TYPE "public"."role" AS ENUM('ADMIN', 'DOCTOR', 'RECEPTION', 'PATIENT');--> statement-breakpoint
CREATE TABLE "appointment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"duration_min" integer DEFAULT 20 NOT NULL,
	"buffer_before_min" integer DEFAULT 0 NOT NULL,
	"buffer_after_min" integer DEFAULT 5 NOT NULL,
	"price_minor_unit" integer,
	"currency" varchar(3) DEFAULT 'TRY',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"appointment_type_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_size_min" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"windows" varchar(255),
	"note" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"specialties" text,
	"languages" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" varchar(120) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"email" varchar(255),
	"dob" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" DEFAULT 'PATIENT' NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(120),
	"phone" varchar(40),
	"preferred_language" varchar(5) DEFAULT 'tr',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointment_type_id_appointment_types_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appt_doctor_start_idx" ON "appointments" USING btree ("doctor_id","start_time");--> statement-breakpoint
CREATE INDEX "appt_patient_start_idx" ON "appointments" USING btree ("patient_id","start_time");--> statement-breakpoint
CREATE INDEX "avail_doctor_dow_idx" ON "availabilities" USING btree ("doctor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "avail_exc_doctor_date_idx" ON "availability_exceptions" USING btree ("doctor_id","date");