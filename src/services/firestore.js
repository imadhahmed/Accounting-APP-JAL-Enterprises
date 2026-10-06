import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection References
export const PROJECTS_COLLECTION = 'projects';
export const BILLS_COLLECTION = 'bills';
export const USERS_COLLECTION = 'users';
export const COMMON_PAYS_COLLECTION = 'commonPays';

// Projects
export const getProjects = (userId) => {
    // Assuming projects are user-specific or shared. For now, fetch all or filter by user if needed.
    // If user-specific: query(collection(db, PROJECTS_COLLECTION), where("userId", "==", userId));
    return query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));
};

export const addProject = async (projectData) => {
    return await addDoc(collection(db, PROJECTS_COLLECTION), {
        ...projectData,
        createdAt: new Date().toISOString(),
        credits: 0,
        expenses: 0,
        balance: 0 // credited - expenses
    });
};

export const getProjectSubcollection = (projectId, subcollection) => {
    return query(collection(db, PROJECTS_COLLECTION, projectId, subcollection), orderBy('date', 'desc'));
};

export const addProjectTransaction = async (projectId, type, data) => {
    // type is 'credits' or 'expenses'
    const subRef = collection(db, PROJECTS_COLLECTION, projectId, type);
    await addDoc(subRef, {
        ...data,
        createdAt: new Date().toISOString()
    });

    // Update project totals
    // Note: For atomicity, use a transaction or batch, but for simplicity here we update directly.
    // Ideally use cloud functions or runTransaction.
    // I'll leave it simple for now but correct the totals.
    // We need to fetch current project to update total? 
    // Or increment field.
    // Incrementing is safer.
    // import { increment } from 'firebase/firestore';
    // updateDoc(doc(db, PROJECTS_COLLECTION, projectId), { [type]: increment(amount) });
};

// Start using increment for atomic updates
import { increment } from 'firebase/firestore';

export const addCredit = async (projectId, amount, date, description = '') => {
    const creditRef = collection(db, PROJECTS_COLLECTION, projectId, 'credits');
    const docRef = await addDoc(creditRef, {
        amount: Number(amount),
        date: date,
        description: description,
        createdAt: new Date().toISOString()
    });

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        credits: increment(Number(amount)),
        totalCredited: increment(Number(amount))
    });
    return docRef;
};

export const addExpense = async (projectId, amount, date, description) => {
    const expenseRef = collection(db, PROJECTS_COLLECTION, projectId, 'expenses');
    const docRef = await addDoc(expenseRef, {
        amount: Number(amount),
        date: date,
        description: description,
        createdAt: new Date().toISOString()
    });

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        totalExpenses: increment(Number(amount))
    });
    return docRef;
};

// Shop Billing
export const getBills = () => {
    return query(collection(db, BILLS_COLLECTION), orderBy('date', 'desc'));
};

export const getBill = async (billId) => {
    // Use getDoc for single document, but here we might return a simpler helper or use it in component
    // We'll leave it to component to use onSnapshot with doc ref
};

export const addBill = async (billData) => {
    // billData includes totalAmount, settledAmount (initial)
    const docRef = await addDoc(collection(db, BILLS_COLLECTION), {
        ...billData,
        createdAt: new Date().toISOString()
    });

    // If initial settlement exists, add it to settlements collection
    if (billData.settledAmount > 0) {
        await addDoc(collection(db, 'settlements'), {
            billId: docRef.id,
            amount: Number(billData.settledAmount),
            date: billData.date,
            createdAt: new Date().toISOString()
        });
    }

    return docRef;
};

export const getSettlements = (billId) => {
    return query(collection(db, 'settlements'), where('billId', '==', billId));
};

export const addSettlement = async (billId, amount, date) => {
    await addDoc(collection(db, 'settlements'), {
        billId,
        amount: Number(amount),
        date,
        createdAt: new Date().toISOString()
    });

    const billRef = doc(db, BILLS_COLLECTION, billId);
    await updateDoc(billRef, {
        settledAmount: increment(Number(amount))
    });
};

export const updateProject = async (projectId, data) => {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, data);
};

export const deleteProject = async (projectId) => {
    // Note: This does not delete subcollections (credits, expenses).
    // In a real app, you'd want to use a Cloud Function or batch delete them.
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
};

export const updateBill = async (billId, data) => {
    const billRef = doc(db, BILLS_COLLECTION, billId);
    await updateDoc(billRef, data);
};

export const deleteBill = async (billId) => {
    // First, find and delete all settlements associated with this bill
    const settlementsQuery = query(collection(db, 'settlements'), where('billId', '==', billId));
    const settlementsSnapshot = await getDocs(settlementsQuery);

    // Create an array of delete promises for all settlements
    const deletePromises = settlementsSnapshot.docs.map(settlementDoc =>
        deleteDoc(doc(db, 'settlements', settlementDoc.id))
    );

    // Wait for all settlements to be deleted
    await Promise.all(deletePromises);

    // Finally, delete the bill itself
    await deleteDoc(doc(db, BILLS_COLLECTION, billId));
};

// Subcollection Updates
export const updateCredit = async (projectId, creditId, oldAmount, newAmount, date, description) => {
    const creditRef = doc(db, PROJECTS_COLLECTION, projectId, 'credits', creditId);
    const updateData = { amount: Number(newAmount), date };
    if (description !== undefined) {
        updateData.description = description;
    }
    await updateDoc(creditRef, updateData);

    if (Number(oldAmount) !== Number(newAmount)) {
        const diff = Number(newAmount) - Number(oldAmount);
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
        await updateDoc(projectRef, {
            totalCredited: increment(diff)
        });
    }
};

export const deleteCredit = async (projectId, creditId, amount) => {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'credits', creditId));
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        totalCredited: increment(-Number(amount))
    });
};

export const updateExpense = async (projectId, expenseId, oldAmount, newAmount, date, description) => {
    const expenseRef = doc(db, PROJECTS_COLLECTION, projectId, 'expenses', expenseId);
    await updateDoc(expenseRef, { amount: Number(newAmount), date, description });

    if (Number(oldAmount) !== Number(newAmount)) {
        const diff = Number(newAmount) - Number(oldAmount);
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
        await updateDoc(projectRef, {
            totalExpenses: increment(diff)
        });
    }
};

export const deleteExpense = async (projectId, expenseId, amount) => {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'expenses', expenseId));
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        totalExpenses: increment(-Number(amount))
    });
};

export const updateSettlement = async (billId, settlementId, oldAmount, newAmount, date) => {
    const settlementRef = doc(db, 'settlements', settlementId);
    await updateDoc(settlementRef, { amount: Number(newAmount), date });

    if (Number(oldAmount) !== Number(newAmount)) {
        const diff = Number(newAmount) - Number(oldAmount);
        const billRef = doc(db, BILLS_COLLECTION, billId);
        await updateDoc(billRef, {
            settledAmount: increment(diff)
        });
    }
};

export const deleteSettlement = async (billId, settlementId, amount) => {
    await deleteDoc(doc(db, 'settlements', settlementId));
    const billRef = doc(db, BILLS_COLLECTION, billId);
    await updateDoc(billRef, {
        settledAmount: increment(-Number(amount))
    });
};

// Common Pays
export const getCommonPays = () => {
    return query(collection(db, COMMON_PAYS_COLLECTION), orderBy('date', 'desc'));
};

export const addCommonPay = async (shopName, amount, date, description = '') => {
    return await addDoc(collection(db, COMMON_PAYS_COLLECTION), {
        shopName,
        amount: Number(amount),
        date,
        description,
        createdAt: new Date().toISOString()
    });
};

export const deleteCommonPay = async (commonPayId) => {
    await deleteDoc(doc(db, COMMON_PAYS_COLLECTION, commonPayId));
};

// ==========================================
// Subcontracts & Subcontract Accounts Management
// ==========================================

export const getSubcontracts = (projectId) => {
    return query(collection(db, PROJECTS_COLLECTION, projectId, 'subcontracts'), orderBy('createdAt', 'desc'));
};

export const addSubcontract = async (projectId, data) => {
    const subRef = collection(db, PROJECTS_COLLECTION, projectId, 'subcontracts');
    return await addDoc(subRef, {
        ...data,
        contractAmount: Number(data.contractAmount || 0),
        totalPaid: 0,
        status: data.status || 'active',
        createdAt: new Date().toISOString()
    });
};

export const updateSubcontract = async (projectId, subcontractId, data) => {
    const subDocRef = doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId);
    const updateData = { ...data };
    if (updateData.contractAmount !== undefined) {
        updateData.contractAmount = Number(updateData.contractAmount);
    }
    await updateDoc(subDocRef, updateData);
};

export const deleteSubcontract = async (projectId, subcontractId) => {
    const paymentsRef = collection(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);
    for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();
        if (paymentData.syncedExpenseId) {
            try {
                await deleteExpense(projectId, paymentData.syncedExpenseId, paymentData.amount);
            } catch (err) {
                console.error("Error deleting linked expense:", err);
            }
        }
        await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments', paymentDoc.id));
    }
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId));
};

export const getSubcontractPayments = (projectId, subcontractId) => {
    return query(
        collection(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments'),
        orderBy('date', 'desc')
    );
};

export const addSubcontractPayment = async (projectId, subcontractId, paymentData, contractorName = '', syncWithExpenses = true) => {
    const amount = Number(paymentData.amount);
    let syncedExpenseId = null;

    if (syncWithExpenses) {
        const expenseDesc = `Subcontract Pay: ${contractorName || 'Subcontractor'}${paymentData.notes ? ` - ${paymentData.notes}` : ''} (${paymentData.paymentMethod || 'Payment'})`;
        const expenseDoc = await addExpense(projectId, amount, paymentData.date, expenseDesc);
        if (expenseDoc && expenseDoc.id) {
            syncedExpenseId = expenseDoc.id;
        }
    }

    const paymentRef = collection(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments');
    const newPaymentDoc = await addDoc(paymentRef, {
        amount,
        date: paymentData.date,
        paymentMethod: paymentData.paymentMethod || 'Cash',
        referenceNo: paymentData.referenceNo || '',
        notes: paymentData.notes || '',
        syncedExpenseId,
        createdAt: new Date().toISOString()
    });

    const subDocRef = doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId);
    await updateDoc(subDocRef, {
        totalPaid: increment(amount)
    });

    return newPaymentDoc;
};

export const updateSubcontractPayment = async (projectId, subcontractId, paymentId, oldAmount, newPaymentData, contractorName = '') => {
    const newAmount = Number(newPaymentData.amount);
    const oldAmt = Number(oldAmount);
    const paymentDocRef = doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments', paymentId);

    if (newPaymentData.syncedExpenseId) {
        const expenseDesc = `Subcontract Pay: ${contractorName || 'Subcontractor'}${newPaymentData.notes ? ` - ${newPaymentData.notes}` : ''} (${newPaymentData.paymentMethod || 'Payment'})`;
        await updateExpense(projectId, newPaymentData.syncedExpenseId, oldAmt, newAmount, newPaymentData.date, expenseDesc);
    }

    await updateDoc(paymentDocRef, {
        amount: newAmount,
        date: newPaymentData.date,
        paymentMethod: newPaymentData.paymentMethod || 'Cash',
        referenceNo: newPaymentData.referenceNo || '',
        notes: newPaymentData.notes || ''
    });

    if (newAmount !== oldAmt) {
        const diff = newAmount - oldAmt;
        const subDocRef = doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId);
        await updateDoc(subDocRef, {
            totalPaid: increment(diff)
        });
    }
};

export const deleteSubcontractPayment = async (projectId, subcontractId, paymentId, amount, syncedExpenseId) => {
    if (syncedExpenseId) {
        try {
            await deleteExpense(projectId, syncedExpenseId, amount);
        } catch (err) {
            console.error("Error deleting synced expense:", err);
        }
    }

    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId, 'payments', paymentId));

    const subDocRef = doc(db, PROJECTS_COLLECTION, projectId, 'subcontracts', subcontractId);
    await updateDoc(subDocRef, {
        totalPaid: increment(-Number(amount))
    });
};


