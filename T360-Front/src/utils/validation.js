// Règles de validation personnalisées
export const validationRules = {
  // Validation du nom d'utilisateur
  username: [
    { required: true, message: "Veuillez saisir votre nom d'utilisateur !" },
    { min: 3, message: "Le nom d'utilisateur doit contenir au moins 3 caractères !" },
    { max: 20, message: "Le nom d'utilisateur ne peut pas dépasser 20 caractères !" },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores !",
    },
  ],
  // Validation du mot de passe
  password: [
    { required: true, message: "Veuillez saisir votre mot de passe !" },
    { min: 8, message: "Le mot de passe doit contenir au moins 8 caractères !" },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve()
        const hasUpperCase = /[A-Z]/.test(value)
        const hasLowerCase = /[a-z]/.test(value)
        const hasNumber = /\d/.test(value)
        if (!hasUpperCase) {
          return Promise.reject(new Error("Le mot de passe doit contenir au moins une lettre majuscule !"))
        }
        if (!hasLowerCase) {
          return Promise.reject(new Error("Le mot de passe doit contenir au moins une lettre minuscule !"))
        }
        if (!hasNumber) {
          return Promise.reject(new Error("Le mot de passe doit contenir au moins un chiffre !"))
        }
        return Promise.resolve()
      },
    },
  ],
  // Validation de l'email
  email: [
    { required: true, message: "Veuillez saisir votre email !" },
    { type: "email", message: "Veuillez saisir un email valide !" },
  ],
  // Validation du nom
  nom: [
    { required: true, message: "Veuillez saisir votre nom !" },
    { min: 2, message: "Le nom doit contenir au moins 2 caractères !" },
    { max: 50, message: "Le nom ne peut pas dépasser 50 caractères !" },
    {
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      message: "Le nom ne peut contenir que des lettres !",
    },
  ],
  // Validation du prénom
  prenom: [
    { required: true, message: "Veuillez saisir votre prénom !" },
    { min: 2, message: "Le prénom doit contenir au moins 2 caractères !" },
    { max: 50, message: "Le prénom ne peut pas dépasser 50 caractères !" },
    {
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      message: "Le prénom ne peut contenir que des lettres !",
    },
  ],
  // Validation du téléphone
  telephone: [
    { required: true, message: "Veuillez saisir votre numéro de téléphone !" },
    {
      pattern: /^[0-9+\-\s()]+$/,
      message: "Veuillez saisir un numéro de téléphone valide !",
    },
    { min: 8, message: "Le numéro de téléphone doit contenir au moins 8 chiffres !" },
  ],
  // Validation de l'adresse
  adresse: [
    { required: true, message: "Veuillez saisir votre adresse !" },
    { min: 5, message: "L'adresse doit contenir au moins 5 caractères !" },
    { max: 200, message: "L'adresse ne peut pas dépasser 200 caractères !" },
  ],
  // Validation de la nationalité
  nationalite: [
    { required: true, message: "Veuillez saisir votre nationalité !" },
    { min: 2, message: "La nationalité doit contenir au moins 2 caractères !" },
    {
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      message: "La nationalité ne peut contenir que des lettres !",
    },
  ],
  // Validation de la date de naissance
  dateNaissance: [
    { required: true, message: "Veuillez sélectionner votre date de naissance !" },
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve()
        const today = new Date()
        const birthDate = new Date(value)
        const age = today.getFullYear() - birthDate.getFullYear()
        if (birthDate > today) {
          return Promise.reject(new Error("La date de naissance ne peut pas être dans le futur !"))
        }
        if (age < 13) {
          return Promise.reject(new Error("Vous devez avoir au moins 13 ans !"))
        }
        if (age > 120) {
          return Promise.reject(new Error("Veuillez saisir une date de naissance valide !"))
        }
        return Promise.resolve()
      },
    },
  ],
  // Validation du genre
  genre: [{ required: true, message: "Veuillez sélectionner votre genre !" }],
  // New: Validation for CIN/Passport ID
  cin: [
    { required: true, message: "Veuillez saisir votre CIN ou Passeport ID !" },
    { min: 5, message: "Le CIN/Passeport ID doit contenir au moins 5 caractères !" },
    { max: 20, message: "Le CIN/Passeport ID ne peut pas dépasser 20 caractères !" },
    {
      pattern: /^[a-zA-Z0-9]+$/,
      message: "Le CIN/Passeport ID ne peut contenir que des lettres et des chiffres !",
    },
  ],
  // New: Validation for Situation Familiale
  situationFamiliale: [{ required: true, message: "Veuillez sélectionner votre situation familiale !" }],
}

// Fonction pour valider la confirmation du mot de passe
export const getPasswordConfirmRules = (passwordFieldName = "password") => [
  { required: true, message: "Veuillez confirmer votre mot de passe !" },
  ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue(passwordFieldName) === value) {
        return Promise.resolve()
      }
      return Promise.reject(new Error("Les mots de passe ne correspondent pas !"))
    },
  }),
]

// Règles de validation pour les champs optionnels (pour la modification de profil)
export const optionalValidationRules = {
  // Téléphone optionnel
  telephoneOptional: [
    {
      pattern: /^[0-9+\-\s()]+$/,
      message: "Veuillez saisir un numéro de téléphone valide !",
    },
    { min: 8, message: "Le numéro de téléphone doit contenir au moins 8 chiffres !" },
  ],
  // Adresse optionnelle
  adresseOptional: [
    { min: 5, message: "L'adresse doit contenir au moins 5 caractères !" },
    { max: 200, message: "L'adresse ne peut pas dépasser 200 caractères !" },
  ],
  // Nationalité optionnelle
  nationaliteOptional: [
    { min: 2, message: "La nationalité doit contenir au moins 2 caractères !" },
    {
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      message: "La nationalité ne peut contenir que des lettres !",
    },
  ],
}
