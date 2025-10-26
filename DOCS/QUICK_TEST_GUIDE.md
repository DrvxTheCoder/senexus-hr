# Quick Test Guide - 5 Minute Setup

## Prerequisites
- ✅ Database connection working
- ✅ User logged in
- ✅ Firm/organization exists

---

## Step 1: Create Clients (2 minutes)

**Navigate to:** `/{yourFirmSlug}/crm/clients`

**Click "Ajouter un client" and create 3 clients:**

### Client 1
```
Nom: ABC Corporation
Statut: ACTIVE
Nom du contact: Marie Ndiaye
Email: marie@abc.sn
→ Click "Créer"
```

### Client 2
```
Nom: XYZ Industries
Statut: ACTIVE
→ Click "Créer"
```

### Client 3
```
Nom: Tech Solutions
Statut: PROSPECT
→ Click "Créer"
```

**Verify:** Stats show Total: 3, Actifs: 2, Prospects: 1

---

## Step 2: Create Employees (3 minutes)

**Navigate to:** `/{yourFirmSlug}/hr/employees`

**Click "Ajouter un employé" and create 2 employees:**

### Employee 1
```
Prénom: Amadou
Nom: Diallo
Matricule: EMP-2024-001
Date d'embauche: 2024-01-15
1ère date d'intérim: 2024-01-15
Email: amadou.diallo@example.com
Client assigné: ABC Corporation
→ Click "Créer"
```

### Employee 2
```
Prénom: Aïssatou
Nom: Sow
Matricule: EMP-2024-002
Date d'embauche: 2024-02-01
1ère date d'intérim: 2024-02-01
Email: aissatou.sow@example.com
Client assigné: XYZ Industries
→ Click "Créer"
```

**Verify:** Stats show Total: 2, Actifs: 2

---

## Step 3: Test Features (1 minute)

### Test Search
```
1. Type "Amadou" in search box
2. Only Amadou Diallo should appear
```

### Test Filter
```
1. Select "Actif" in status dropdown
2. Both employees should appear
```

### Test Edit
```
1. Click "Modifier" on Amadou Diallo
2. Change phone number
3. Click "Mettre à jour"
4. Verify change saved
```

### Verify Client Assignment
```
1. Go back to CRM clients page
2. ABC Corporation should show "1" in Employés column
3. XYZ Industries should show "1" in Employés column
4. Tech Solutions should show "0" (no employees)
```

---

## ✅ You're Done!

**What you just tested:**
- ✅ Client CRUD operations
- ✅ Employee CRUD operations
- ✅ Client-employee relationships
- ✅ Search and filtering
- ✅ Statistics dashboards
- ✅ Data validation
- ✅ Form submissions

**What's working:**
- Complete CRM module
- Complete HR employee management
- Full integration between modules
- Real-time updates
- French language interface

**Next steps:**
- Add more test data
- Test edge cases
- Explore 2-year compliance tracking (create employee with old firstInterimDate)
- Try emergency contact fields
- Test different employee statuses

---

## Common Issues

**Issue:** "Accès refusé"
**Solution:** Make sure you're logged in and belong to the firm

**Issue:** Client dropdown empty in employee form
**Solution:** Create clients first in CRM module

**Issue:** Stats not updating
**Solution:** Refresh the page or check that firmId is being fetched

**Issue:** Form validation errors
**Solution:** Fill all required fields (marked with *)

---

## Quick Reference

### Required Employee Fields
- Prénom (First name)
- Nom (Last name)
- Matricule (Employee number)
- Date d'embauche (Hire date)
- 1ère date d'intérim (First interim date)

### Required Client Fields
- Nom (Client name)

### Employee Statuses
- ACTIVE (Actif)
- INACTIVE (Inactif)
- ON_LEAVE (En congé)
- SUSPENDED (Suspendu)
- TERMINATED (Terminé)

### Client Statuses
- ACTIVE (Actif)
- INACTIVE (Inactif)
- PROSPECT (Prospect)
- ARCHIVED (Archivé)

---

**Happy Testing! 🚀**
