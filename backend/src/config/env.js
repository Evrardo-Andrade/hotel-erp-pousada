import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3333),
  nodeEnv: process.env.NODE_ENV || "development",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabasePublicBucket: process.env.SUPABASE_PUBLIC_BUCKET || "product-images",
  supabasePrivateBucket: process.env.SUPABASE_PRIVATE_BUCKET || "guest-documents",
  debugRooms: process.env.DEBUG_ROOMS === "true",
  fiscalEnv: process.env.FISCAL_ENV || "homologacao",
  sefazUf: process.env.SEFAZ_UF || "SP",
  certPassword: process.env.CERT_PASSWORD || "",
  trustProxy: process.env.TRUST_PROXY === "true",
  sefazUrls: {
    nfe: {
      homologacao: process.env.SEFAZ_NFE_HOMOLOG_URL || "https://hom.nfe.fazenda.gov.br/ws/NFeAutorizacao4",
      producao: process.env.SEFAZ_NFE_PRODUCAO_URL || "https://www.nfe.fazenda.gov.br/ws/NFeAutorizacao4"
    },
    nfce: {
      homologacao: process.env.SEFAZ_NFCE_HOMOLOG_URL || "https://hom.nfce.fazenda.gov.br/ws/NFeAutorizacao4",
      producao: process.env.SEFAZ_NFCE_PRODUCAO_URL || "https://www.nfce.fazenda.gov.br/ws/NFeAutorizacao4"
    }
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "hotel_erp",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres"
  }
};
