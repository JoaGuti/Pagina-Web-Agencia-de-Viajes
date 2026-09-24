CREATE TABLE "actividad" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" uuid,
	"nombre" text NOT NULL,
	"accion" text NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arrepentimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"dni" text NOT NULL,
	"email" text NOT NULL,
	"reserva" text NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arrepentimientos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "configuracion" (
	"id" integer PRIMARY KEY NOT NULL,
	"datos" jsonb NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text NOT NULL,
	"destino" text DEFAULT '' NOT NULL,
	"fecha_viaje" text DEFAULT '' NOT NULL,
	"mensaje" text DEFAULT '' NOT NULL,
	"estado" text DEFAULT 'nueva' NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limites" (
	"clave" text PRIMARY KEY NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"desde" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ofertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paquete_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"etiqueta" text DEFAULT 'Oferta relámpago' NOT NULL,
	"descuento" integer DEFAULT 0 NOT NULL,
	"precio_final" integer DEFAULT 0 NOT NULL,
	"desde" timestamp with time zone NOT NULL,
	"hasta" timestamp with time zone NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"contador" boolean DEFAULT true NOT NULL,
	"cupos" integer DEFAULT 0 NOT NULL,
	"nota" text DEFAULT '' NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paquetes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"destino" text DEFAULT '' NOT NULL,
	"pais" text DEFAULT '' NOT NULL,
	"iata" text DEFAULT '' NOT NULL,
	"region" text DEFAULT 'caribe' NOT NULL,
	"tipo" text DEFAULT 'Playa' NOT NULL,
	"etiqueta" text DEFAULT '' NOT NULL,
	"etiqueta_color" text DEFAULT 'rojo' NOT NULL,
	"resumen" text DEFAULT '' NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"estado" text DEFAULT 'borrador' NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"moneda" text DEFAULT 'USD' NOT NULL,
	"precio" integer DEFAULT 0 NOT NULL,
	"precio_single" integer DEFAULT 0 NOT NULL,
	"precio_triple" integer DEFAULT 0 NOT NULL,
	"precio_menor" integer DEFAULT 0 NOT NULL,
	"cuotas" integer DEFAULT 0 NOT NULL,
	"sena" integer DEFAULT 0 NOT NULL,
	"noches" integer DEFAULT 7 NOT NULL,
	"cupos" integer DEFAULT 0 NOT NULL,
	"regimen" text DEFAULT '' NOT NULL,
	"transporte" text DEFAULT 'Aéreo' NOT NULL,
	"salida_desde" text DEFAULT 'Córdoba' NOT NULL,
	"salidas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hotel" text DEFAULT '' NOT NULL,
	"estrellas" integer DEFAULT 0 NOT NULL,
	"itinerario" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"incluye" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"no_incluye" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fotos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coord" text DEFAULT '' NOT NULL,
	"seo_titulo" text DEFAULT '' NOT NULL,
	"seo_descripcion" text DEFAULT '' NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paquetes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "resenas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autor" text NOT NULL,
	"texto" text NOT NULL,
	"estrellas" integer DEFAULT 5 NOT NULL,
	"cuando" text DEFAULT '' NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesiones" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"vence" timestamp with time zone NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suscriptores" (
	"email" text PRIMARY KEY NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"hash" text,
	"rol" text DEFAULT 'edicion' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"intentos_fallidos" integer DEFAULT 0 NOT NULL,
	"bloqueado_hasta" timestamp with time zone,
	"ultimo_ingreso" timestamp with time zone,
	"invitacion_hash" text,
	"invitacion_vence" timestamp with time zone,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_paquete_id_paquetes_id_fk" FOREIGN KEY ("paquete_id") REFERENCES "public"."paquetes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultas_creado_idx" ON "consultas" USING btree ("creado");--> statement-breakpoint
CREATE INDEX "paquetes_estado_idx" ON "paquetes" USING btree ("estado");