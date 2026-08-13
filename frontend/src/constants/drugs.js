/**
 * Dental Clinic Drug Formulary
 * Used for autocomplete in the Prescription form.
 * Each entry includes: category, generic name, strength, dosage form, and route.
 */
export const DRUG_LIST = [
    // ── Pain Relief ─────────────────────────────────────────
    { category: "Pain relief", name: "Paracetamol (Acetaminophen)", strength: "500 mg", form: "Tablet", route: "Oral" },
    { category: "Pain relief", name: "Ibuprofen", strength: "200 mg", form: "Tablet", route: "Oral" },
    { category: "Pain relief", name: "Ibuprofen", strength: "400 mg", form: "Tablet", route: "Oral" },
    { category: "Pain relief", name: "Diclofenac", strength: "50 mg", form: "Tablet", route: "Oral" },
    { category: "Pain relief", name: "Ketorolac", strength: "10 mg", form: "Tablet", route: "Oral" },

    // ── Antibiotics ─────────────────────────────────────────
    { category: "Antibiotic", name: "Amoxicillin", strength: "500 mg", form: "Capsule", route: "Oral" },
    { category: "Antibiotic", name: "Amoxicillin + Clavulanic acid", strength: "625 mg", form: "Tablet", route: "Oral" },
    { category: "Antibiotic", name: "Metronidazole", strength: "500 mg", form: "Tablet", route: "Oral" },
    { category: "Antibiotic", name: "Clindamycin", strength: "300 mg", form: "Capsule", route: "Oral" },
    { category: "Antibiotic", name: "Azithromycin", strength: "500 mg", form: "Tablet", route: "Oral" },

    // ── Oral Care ───────────────────────────────────────────
    { category: "Oral care", name: "Chlorhexidine gluconate", strength: "0.12%", form: "Mouthwash", route: "Oral rinse" },
    { category: "Oral care", name: "Chlorhexidine gluconate", strength: "0.2%", form: "Mouthwash", route: "Oral rinse" },

    // ── Antiseptic ──────────────────────────────────────────
    { category: "Antiseptic", name: "Hydrogen peroxide", strength: "3%", form: "Solution", route: "Topical" },
    { category: "Antiseptic", name: "Povidone-iodine", strength: "10%", form: "Solution", route: "Topical" },

    // ── Local Anesthetics ───────────────────────────────────
    { category: "Local anesthetic", name: "Lidocaine + Epinephrine", strength: "2% + 1:80,000", form: "Dental cartridge", route: "Local" },
    { category: "Local anesthetic", name: "Articaine + Epinephrine", strength: "4% + 1:100,000", form: "Dental cartridge", route: "Local" },
    { category: "Local anesthetic", name: "Mepivacaine", strength: "3%", form: "Dental cartridge", route: "Local" },

    // ── Topical Anesthetic ──────────────────────────────────
    { category: "Topical anesthetic", name: "Lidocaine", strength: "2–5%", form: "Gel", route: "Topical" },

    // ── Antifungal ──────────────────────────────────────────
    { category: "Antifungal", name: "Nystatin", strength: "100,000 units/mL", form: "Oral suspension", route: "Oral" },
    { category: "Antifungal", name: "Miconazole", strength: "2%", form: "Oral gel", route: "Oral" },

    // ── Emergency ───────────────────────────────────────────
    { category: "Emergency", name: "Adrenaline (Epinephrine)", strength: "1 mg/mL (1:1000)", form: "Injection", route: "IM" },
    { category: "Emergency", name: "Salbutamol", strength: "100 mcg/dose", form: "Inhaler", route: "Inhalation" },
    { category: "Emergency", name: "Nitroglycerin", strength: "0.4 mg/dose", form: "Sublingual", route: "Sublingual" },
    { category: "Emergency", name: "Aspirin", strength: "300/325 mg", form: "Tablet", route: "Oral" },
    { category: "Emergency", name: "Glucose/Dextrose", strength: "Various", form: "Gel/Tablets", route: "Oral" },
    { category: "Emergency", name: "Oxygen", strength: "Medical grade", form: "Gas", route: "Inhalation" },

    // ── Anti-inflammatory ───────────────────────────────────
    { category: "Anti-inflammatory", name: "Dexamethasone", strength: "4 mg", form: "Tablet/Injection", route: "Oral/Injection" },
    { category: "Anti-inflammatory", name: "Prednisolone", strength: "5 mg", form: "Tablet", route: "Oral" },

    // ── Preventive ──────────────────────────────────────────
    { category: "Preventive", name: "Sodium fluoride varnish", strength: "5%", form: "Varnish", route: "Topical" },
    { category: "Preventive", name: "Fluoride gel", strength: "Various", form: "Gel", route: "Topical" },

    // ── Dental Material ─────────────────────────────────────
    { category: "Dental material", name: "Calcium hydroxide", strength: "Various", form: "Dental material", route: "Dental use" },
    { category: "Dental material", name: "Eugenol", strength: "Various", form: "Solution", route: "Dental use" },
];

/**
 * Returns a formatted display string for a drug entry.
 * e.g. "Amoxicillin 500 mg — Capsule"
 */
export const formatDrugDisplay = (drug) =>
    `${drug.name} ${drug.strength} — ${drug.form}`;

/**
 * Returns the value to insert into the prescription drug field.
 * e.g. "Amoxicillin 500 mg / Capsule / Oral"
 */
export const formatDrugForPrescription = (drug) =>
    `${drug.name} ${drug.strength} / ${drug.form}`;
