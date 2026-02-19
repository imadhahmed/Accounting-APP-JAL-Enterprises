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
// Collection References
export const PROJECTS_COLLECTION = 'projects';
export const BILLS_COLLECTION = 'bills';
export const USERS_COLLECTION = 'users';

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

export const addCredit = async (projectId, amount, date) => {
    const creditRef = collection(db, PROJECTS_COLLECTION, projectId, 'credits');
    await addDoc(creditRef, {
        amount: Number(amount),
        date: date,
        createdAt: new Date().toISOString()
    });

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        credits: increment(Number(amount)),
        // balance: credits - expenses. We can't easily calc balance with increment alone if we don't store it separate or use listeners.
        // Better to store 'creditsTotal' and 'expensesTotal'.
        // Let's use 'totalCredited' and 'totalExpenses'.
        totalCredited: increment(Number(amount))
    });
};

export const addExpense = async (projectId, amount, date, description) => {
    const expenseRef = collection(db, PROJECTS_COLLECTION, projectId, 'expenses');
    await addDoc(expenseRef, {
        amount: Number(amount),
        date: date,
        description: description,
        createdAt: new Date().toISOString()
    });

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        totalExpenses: increment(Number(amount))
    });
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
    return query(collection(db, 'settlements'), where('billId', '==', billId), orderBy('date', 'desc'));
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
    // Note: usage of deleteDoc for bill. Settlements associated should ideally be deleted too.
    await deleteDoc(doc(db, BILLS_COLLECTION, billId));
};

// Subcollection Updates
export const updateCredit = async (projectId, creditId, oldAmount, newAmount, date) => {
    const creditRef = doc(db, PROJECTS_COLLECTION, projectId, 'credits', creditId);
    await updateDoc(creditRef, { amount: Number(newAmount), date });

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
