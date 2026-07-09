export type SeoPage = {
  slug: string;
  title: string;
  description: string;
  kicker: string;
  primaryCta: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export const seoPages: Record<string, SeoPage> = {
  "change-order-template": {
    slug: "change-order-template",
    title: "Change Order Template for Contractors",
    description:
      "Use this change order template to document added work, pricing, approval language, and payment terms before the extra work starts.",
    kicker: "Template",
    primaryCta: "Generate a change order",
    sections: [
      {
        heading: "What to include",
        body:
          "A useful change order names the original scope, the added request, the price, payment terms, approval deadline, and what is not included."
      },
      {
        heading: "When to send it",
        body:
          "Send it before starting the added work. Written approval is easier to get while the request is fresh and before the extra labor is already sunk."
      },
      {
        heading: "Keep it businesslike",
        body:
          "Use calm, specific language. The goal is not to argue about the request. The goal is to protect the project record and get paid for approved work."
      }
    ]
  },
  "scope-creep-email-generator": {
    slug: "scope-creep-email-generator",
    title: "Scope Creep Email Generator",
    description:
      "Turn an out-of-scope client request into a polite email that explains the added work, cost, and approval step.",
    kicker: "Email generator",
    primaryCta: "Write the client email",
    sections: [
      {
        heading: "Stay polite and firm",
        body:
          "Good scope emails acknowledge the request, price the added work, and ask for approval without making the client feel blamed."
      },
      {
        heading: "Tie it to the original scope",
        body:
          "Referencing the agreed scope keeps the message factual. It helps the client understand why the request changes the price or schedule."
      },
      {
        heading: "Ask for a simple approval",
        body:
          "A reply that says Approved is easier for a client than a long approval workflow. Store that reply with the job record."
      }
    ]
  },
  "contractor-change-order-calculator": {
    slug: "contractor-change-order-calculator",
    title: "Contractor Change Order Calculator",
    description:
      "Calculate labor, materials, margin, rush fees, deposit, and total price for added contractor work.",
    kicker: "Calculator",
    primaryCta: "Calculate added work",
    sections: [
      {
        heading: "Price more than materials",
        body:
          "Added work often affects schedule, setup, procurement, cleanup, and coordination. Include labor and margin, not only material cost."
      },
      {
        heading: "Use deposits for risk",
        body:
          "A deposit can protect cash flow when added work requires materials or schedule disruption. Keep the terms clear and written."
      },
      {
        heading: "Save the math",
        body:
          "Send the breakdown with the approval request so the client sees exactly how the change order total was built."
      }
    ]
  },
  "extra-work-approval-email": {
    slug: "extra-work-approval-email",
    title: "Extra Work Approval Email",
    description:
      "Create a short approval email before doing extra work on a fixed-scope project.",
    kicker: "Approval",
    primaryCta: "Create approval language",
    sections: [
      {
        heading: "Do not start with a handshake",
        body:
          "Verbal approval is easy to forget when the invoice arrives. A written email creates a clearer record for both sides."
      },
      {
        heading: "Make the next step obvious",
        body:
          "Ask the client to reply with Approved. Do not bury the approval request under a long explanation."
      },
      {
        heading: "Name the schedule impact",
        body:
          "If the extra work changes timing, include that in the email. Scope, price, and schedule belong together."
      }
    ]
  },
  "payment-schedule-calculator": {
    slug: "payment-schedule-calculator",
    title: "Payment Schedule Calculator",
    description:
      "Set a practical deposit and balance schedule for added work on a contractor or service project.",
    kicker: "Payment schedule",
    primaryCta: "Calculate payment terms",
    sections: [
      {
        heading: "Match payment to risk",
        body:
          "Higher material costs, rushed timelines, and unclear scope usually justify collecting more before the added work begins."
      },
      {
        heading: "Separate deposit and balance",
        body:
          "A clear deposit amount and balance amount makes it easier for the client to approve and easier for you to invoice."
      },
      {
        heading: "Avoid surprise invoices",
        body:
          "Clients are less likely to dispute a charge when the payment schedule was visible before the work started."
      }
    ]
  },
  "late-invoice-follow-up-template": {
    slug: "late-invoice-follow-up-template",
    title: "Late Invoice Follow-Up Template",
    description:
      "Draft a calm late invoice follow-up that points back to approved work and payment terms.",
    kicker: "Follow-up",
    primaryCta: "Draft payment follow-up",
    sections: [
      {
        heading: "Start with the record",
        body:
          "Reference the approved scope, invoice number, amount, and due date before escalating tone."
      },
      {
        heading: "Give one clear action",
        body:
          "Ask for payment or a specific reply date. A vague follow-up is easier to ignore."
      },
      {
        heading: "Review rules before fees",
        body:
          "Late fees, interest, liens, and legal escalation depend on contracts and local law. Keep the first version businesslike."
      }
    ]
  },
  "work-order-template": {
    slug: "work-order-template",
    title: "Work Order Template for Contractors",
    description:
      "Create a contractor work order with scope of work, job location, schedule, payment terms, exclusions, and client approval language.",
    kicker: "Work order",
    primaryCta: "Create a work order",
    sections: [
      {
        heading: "Confirm the job before scheduling",
        body:
          "A work order gives the client a clear record of what is included, where the job happens, what it costs, and what needs to be ready before work starts."
      },
      {
        heading: "Name client responsibilities",
        body:
          "Site access, selections, owner-supplied materials, and timely approvals can affect schedule and cost. Put those responsibilities in writing."
      },
      {
        heading: "Keep changes separate",
        body:
          "Once the work order is approved, added requests should move through a written change order so the original job stays clean."
      }
    ]
  },
  "service-agreement-template": {
    slug: "service-agreement-template",
    title: "Service Agreement Template Starter",
    description:
      "Draft a practical service agreement starter with service scope, payment schedule, change policy, cancellation language, exclusions, and signature blocks.",
    kicker: "Agreement starter",
    primaryCta: "Draft a service agreement",
    sections: [
      {
        heading: "Use clear business terms",
        body:
          "A service agreement starter should explain the services, payment schedule, exclusions, change process, and responsibilities in plain language."
      },
      {
        heading: "Include a change policy",
        body:
          "Scope changes are easier to manage when the agreement says added work must be priced and approved before it is scheduled."
      },
      {
        heading: "Review before relying on it",
        body:
          "Agreement language can depend on location, trade, licensing, and local rules. Treat this as a business starter and have legal terms reviewed."
      }
    ]
  },
  "contractor-work-order-generator": {
    slug: "contractor-work-order-generator",
    title: "Contractor Work Order Generator",
    description:
      "Generate work orders for home-service and contractor jobs with pricing, schedule notes, client responsibilities, and approval language.",
    kicker: "Generator",
    primaryCta: "Generate a work order",
    sections: [
      {
        heading: "Start from the job details",
        body:
          "Enter the client, project, location, scope, labor, materials, deposit, and schedule notes to build a clean work order."
      },
      {
        heading: "Send a client-ready document",
        body:
          "The generator creates a printable document and a client email so approval can happen before labor or materials are committed."
      },
      {
        heading: "Save repeat jobs",
        body:
          "Signed-in users can save, duplicate, archive, and reopen work order drafts from the dashboard."
      }
    ]
  }
};

export const seoPageList = Object.values(seoPages);
