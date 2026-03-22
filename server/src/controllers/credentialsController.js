import {
  createCredential,
  getCredentialsByUserId,
  getCredentialById,
  updateCredential,
  deleteCredential
} from '../models/database.js';

export async function getCredentials(req, res) {
  try {
    const userId = req.user.id;
    const credentials = await getCredentialsByUserId(userId);

    // Return credentials with encrypted data (client will decrypt)
    const formattedCredentials = credentials.map(cred => ({
      id: cred.id,
      website: cred.website,
      username: cred.username,
      encryptedPassword: cred.encrypted_password,
      iv: cred.iv,
      createdAt: cred.created_at
    }));

    res.json(formattedCredentials);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addCredential(req, res) {
  try {
    const userId = req.user.id;
    const { website, username, encryptedPassword, iv } = req.body;

    if (!website || !username || !encryptedPassword || !iv) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const credentialId = await createCredential(userId, website, username, encryptedPassword, iv);

    res.status(201).json({
      message: 'Credential added successfully',
      id: credentialId
    });
  } catch (error) {
    console.error('Add credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function editCredential(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { website, username, encryptedPassword, iv } = req.body;

    if (!website || !username || !encryptedPassword || !iv) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const changes = await updateCredential(id, userId, website, username, encryptedPassword, iv);

    if (changes === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ message: 'Credential updated successfully' });
  } catch (error) {
    console.error('Edit credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeCredential(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const changes = await deleteCredential(id, userId);

    if (changes === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCredential(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const credential = await getCredentialById(id, userId);

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({
      id: credential.id,
      website: credential.website,
      username: credential.username,
      encryptedPassword: credential.encrypted_password,
      iv: credential.iv,
      createdAt: credential.created_at
    });
  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
