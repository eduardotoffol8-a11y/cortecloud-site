export type ProductId = "moveis" | "obra-civil" | "hidraulica" | "eletrica" | "revestimentos" | "pintura";

export type ProductDefinition = {
  id: ProductId;
  name: string;
  shortName: string;
  description: string;
  audience: string;
  href: string;
  presentationHref?: string;
  status: "available" | "coming-soon";
};

export const productCatalog: ProductDefinition[] = [
  {
    id: "moveis",
    name: "OrçaMóvel",
    shortName: "Móveis",
    description: "Orçamentos profissionais para marcenaria sob medida, com clientes, projetos e PDFs personalizados.",
    audience: "Marceneiros e marcenarias",
    href: "/apps/moveis",
    presentationHref: "/apps/moveis/apresentacao",
    status: "available",
  },
  {
    id: "obra-civil",
    name: "OrçaObra",
    shortName: "Obra civil",
    description: "Orçamentos organizados por serviços, materiais, mão de obra, equipamentos, etapas e BDI.",
    audience: "Pedreiros, mestres de obra, construtores e profissionais de reformas",
    href: "/apps/obra-civil",
    presentationHref: "/apps/obra-civil/apresentacao",
    status: "available",
  },
  {
    id: "hidraulica",
    name: "OrçaHidro",
    shortName: "Hidráulica",
    description: "Orçamentos para tubulações, conexões, pontos e serviços hidráulicos.",
    audience: "Encanadores e profissionais hidráulicos",
    href: "/apps/hidraulica",
    presentationHref: "/apps/hidraulica/apresentacao",
    status: "coming-soon",
  },
  {
    id: "eletrica",
    name: "OrçaElétrica",
    shortName: "Elétrica",
    description: "Orçamentos por pontos, circuitos, cabos, quadros e serviços elétricos.",
    audience: "Eletricistas e instaladores",
    href: "/apps/eletrica",
    presentationHref: "/apps/eletrica/apresentacao",
    status: "coming-soon",
  },
  {
    id: "revestimentos",
    name: "OrçaRevest",
    shortName: "Revestimentos",
    description: "Orçamentos por área, piso, azulejo, revestimento e assentamento.",
    audience: "Azulejistas e assentadores",
    href: "/apps/revestimentos",
    presentationHref: "/apps/revestimentos/apresentacao",
    status: "coming-soon",
  },
  {
    id: "pintura",
    name: "OrçaPintura",
    shortName: "Pintura",
    description: "Orçamentos por ambientes, áreas, preparação, materiais, demãos e acabamento.",
    audience: "Pintores e empresas de pintura",
    href: "/apps/pintura",
    presentationHref: "/apps/pintura/apresentacao",
    status: "coming-soon",
  },
];
