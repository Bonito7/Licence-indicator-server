// Configuration
const API_URL = 'http://localhost:3000/api';
let adminSecret = '';
let allLicenses = [];

// Connexion
function login() {
    const secret = document.getElementById('adminSecret').value;
    
    if (!secret) {
        showError('loginError', 'Veuillez entrer la clé secrète');
        return;
    }
    
    adminSecret = secret;
    
    // Tester la connexion en chargeant les stats
    fetch(`${API_URL}/stats`, {
        headers: {
            'X-Admin-Secret': adminSecret
        }
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Clé secrète invalide');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('mainSection').style.display = 'block';
            loadDashboard();
        }
    })
    .catch(error => {
        showError('loginError', error.message);
    });
}

// Charger le tableau de bord
function loadDashboard() {
    loadStats();
    loadLicenses();
    loadLogs();
}

// Charger les statistiques
function loadStats() {
    fetch(`${API_URL}/stats`, {
        headers: {
            'X-Admin-Secret': adminSecret
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const stats = data.stats;
            document.getElementById('totalLicenses').textContent = stats.totalLicenses;
            document.getElementById('activeLicenses').textContent = stats.activeLicenses;
            document.getElementById('totalValidations').textContent = stats.totalValidations;
            document.getElementById('successRate').textContent = stats.successRate + '%';
        }
    })
    .catch(error => {
        console.error('Erreur lors du chargement des stats:', error);
    });
}

// Créer une licence
function createLicense(event) {
    event.preventDefault();
    
    const accountNumbersInput = document.getElementById('accountNumbers').value;
    const maxAccounts = parseInt(document.getElementById('maxAccounts').value);
    const expiryDate = document.getElementById('expiryDate').value || null;
    
    // Parser les numéros de compte
    let accountNumbers = [];
    if (accountNumbersInput.trim()) {
        accountNumbers = accountNumbersInput.split(',').map(num => num.trim()).filter(num => num);
    }
    
    const data = {
        accountNumbers,
        maxAccounts,
        expiryDate
    };
    
    fetch(`${API_URL}/licenses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('createSuccess', `Licence créée avec succès! Clé: ${data.license.licenseKey}`);
            document.getElementById('createLicenseForm').reset();
            loadLicenses();
            loadStats();
            
            // Copier la clé dans le presse-papiers
            navigator.clipboard.writeText(data.license.licenseKey);
        } else {
            showError('createError', data.error);
        }
    })
    .catch(error => {
        showError('createError', error.message);
    });
}

// Charger les licences
function loadLicenses() {
    fetch(`${API_URL}/licenses`, {
        headers: {
            'X-Admin-Secret': adminSecret
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            allLicenses = data.licenses;
            displayLicenses(allLicenses);
        }
    })
    .catch(error => {
        console.error('Erreur lors du chargement des licences:', error);
    });
}

// Afficher les licences
function displayLicenses(licenses) {
    const tbody = document.getElementById('licensesBody');
    
    if (licenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucune licence trouvée</td></tr>';
        return;
    }
    
    tbody.innerHTML = licenses.map(license => {
        const expiryDate = license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('fr-FR') : 'Jamais';
        const createdDate = new Date(license.createdAt).toLocaleDateString('fr-FR');
        const statusClass = license.active ? 'status-active' : 'status-inactive';
        const statusText = license.active ? '✅ Active' : '❌ Inactive';
        
        const accountsDisplay = license.accountNumbers.length > 0 
            ? license.accountNumbers.join(', ') 
            : '<em>Aucun</em>';
        
        return `
            <tr>
                <td>
                    <code class="license-key" onclick="copyToClipboard('${license.key}')" title="Cliquer pour copier">
                        ${license.key}
                    </code>
                </td>
                <td>${accountsDisplay}</td>
                <td>${license.accountNumbers.length} / ${license.maxAccounts}</td>
                <td>${expiryDate}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td class="actions">
                    <button onclick="editLicense(${license.id})" class="btn-icon" title="Modifier">✏️</button>
                    <button onclick="toggleLicense(${license.id}, ${!license.active})" class="btn-icon" title="${license.active ? 'Désactiver' : 'Activer'}">
                        ${license.active ? '🔒' : '🔓'}
                    </button>
                    <button onclick="deleteLicense(${license.id})" class="btn-icon btn-danger" title="Supprimer">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrer les licences
function filterLicenses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allLicenses.filter(license => {
        return license.key.toLowerCase().includes(searchTerm) ||
               license.accountNumbers.some(num => num.includes(searchTerm));
    });
    
    displayLicenses(filtered);
}

// Copier dans le presse-papiers
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Clé copiée dans le presse-papiers!');
    });
}

// Éditer une licence
function editLicense(id) {
    const license = allLicenses.find(l => l.id === id);
    if (!license) return;
    
    document.getElementById('editLicenseId').value = license.id;
    document.getElementById('editLicenseKey').value = license.key;
    document.getElementById('editAccountNumbers').value = license.accountNumbers.join(', ');
    document.getElementById('editMaxAccounts').value = license.maxAccounts;
    document.getElementById('editExpiryDate').value = license.expiryDate || '';
    document.getElementById('editActive').checked = license.active;
    
    document.getElementById('editModal').style.display = 'block';
}

// Fermer le modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Mettre à jour une licence
function updateLicense(event) {
    event.preventDefault();
    
    const id = document.getElementById('editLicenseId').value;
    const accountNumbersInput = document.getElementById('editAccountNumbers').value;
    const maxAccounts = parseInt(document.getElementById('editMaxAccounts').value);
    const expiryDate = document.getElementById('editExpiryDate').value || null;
    const active = document.getElementById('editActive').checked;
    
    let accountNumbers = [];
    if (accountNumbersInput.trim()) {
        accountNumbers = accountNumbersInput.split(',').map(num => num.trim()).filter(num => num);
    }
    
    const data = {
        accountNumbers,
        maxAccounts,
        expiryDate,
        active
    };
    
    fetch(`${API_URL}/licenses/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeEditModal();
            loadLicenses();
            loadStats();
            alert('Licence mise à jour avec succès!');
        } else {
            alert('Erreur: ' + data.error);
        }
    })
    .catch(error => {
        alert('Erreur: ' + error.message);
    });
}

// Activer/Désactiver une licence
function toggleLicense(id, active) {
    fetch(`${API_URL}/licenses/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({ active })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadLicenses();
            loadStats();
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
    });
}

// Supprimer une licence
function deleteLicense(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette licence?')) {
        return;
    }
    
    fetch(`${API_URL}/licenses/${id}`, {
        method: 'DELETE',
        headers: {
            'X-Admin-Secret': adminSecret
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadLicenses();
            loadStats();
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
    });
}

// Charger les logs
function loadLogs() {
    fetch(`${API_URL}/logs?limit=50`, {
        headers: {
            'X-Admin-Secret': adminSecret
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayLogs(data.logs);
        }
    })
    .catch(error => {
        console.error('Erreur lors du chargement des logs:', error);
    });
}

// Afficher les logs
function displayLogs(logs) {
    const tbody = document.getElementById('logsBody');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun log trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('fr-FR');
        const resultClass = log.success ? 'log-success' : 'log-error';
        const resultText = log.success ? '✅ Succès' : '❌ Échec';
        const message = log.error_message || '-';
        
        return `
            <tr>
                <td>${timestamp}</td>
                <td><code>${log.license_key}</code></td>
                <td>${log.account_number}</td>
                <td>${log.server_name || '-'}</td>
                <td><span class="${resultClass}">${resultText}</span></td>
                <td>${message}</td>
            </tr>
        `;
    }).join('');
}

// Fonctions utilitaires
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = '❌ ' + message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = '✅ ' + message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Fermer le modal en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeEditModal();
    }
}
