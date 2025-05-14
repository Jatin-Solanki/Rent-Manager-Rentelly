
// This file is being kept for reference but the functionality has been moved to firebaseUtils.ts

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// This function has been moved to firebaseUtils.ts
// It's kept here for reference only
const uploadTenantDocument = async (
  file: File,
  buildingId: string,
  unitId: string,
  documentType: 'idProof' | 'policeVerification'
): Promise<string> => {
  if (!file) throw new Error('No file provided');

  const fileExtension = file.name.split('.').pop();
  const fileName = `${documentType}-${Date.now()}.${fileExtension}`;
  const filePath = `tenants/${buildingId}/${unitId}/${fileName}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
};
