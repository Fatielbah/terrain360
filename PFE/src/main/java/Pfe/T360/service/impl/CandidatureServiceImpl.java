package Pfe.T360.service.impl;

import Pfe.T360.dto.IAResponse;
import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.Competence;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.CandidatureRepository;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.CandidatureService;
import Pfe.T360.service.FileService;
import Pfe.T360.service.IAService;
import Pfe.T360.service.NotificationService;
import Pfe.T360.util.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CandidatureServiceImpl implements CandidatureService {

    @Autowired
    private CandidatureRepository candidatureRepository;
    @Autowired
    private IAService iaService;
    @Autowired
    private FileRepository fileRepository;
    @Autowired
    private UtilisateurRepository utilisateurRepository ;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private FileService fileService;

    @Override
    public Candidature createCandidature(Candidature candidature, MultipartFile cv, MultipartFile lettreMotivation) throws IOException {
        // Définir la date de soumission
        candidature.setDateSoumission(LocalDateTime.now());
        if (candidature.getFicheDePoste() == null || candidature.getFicheDePoste().getId() == null) {
            throw new IllegalArgumentException("Une fiche de poste valide doit être associée à la candidature");
        }
        // Upload et sauvegarde du CV
        if (cv != null && !cv.isEmpty()) {
            File cvFile = File.builder()
                    .name(cv.getOriginalFilename())
                    .type(cv.getContentType())
                    .fileData(FileUtils.compressFile(cv.getBytes()))
                    .build();
            
            // Sauvegarder le fichier CV d'abord
            cvFile = fileRepository.save(cvFile);
            candidature.setCv(cvFile);
        }

        // Upload et sauvegarde de la lettre de motivation
        if (lettreMotivation != null && !lettreMotivation.isEmpty()) {
            File lettreFile = File.builder()
                    .name(lettreMotivation.getOriginalFilename())
                    .type(lettreMotivation.getContentType())
                    .fileData(FileUtils.compressFile(lettreMotivation.getBytes()))
                    .build();
            
            // Sauvegarder le fichier lettre de motivation d'abord
            lettreFile = fileRepository.save(lettreFile);
            candidature.setLettreMotivation(lettreFile);
        }
        // Sauvegarde de la candidature
        Candidature savedCandidature = candidatureRepository.save(candidature);
        
        // Récupération des RH à notifier
        List<Utilisateur> rhList = utilisateurRepository.findByRole(Role.RH);
        
        // Envoi des notifications
        if (rhList != null && !rhList.isEmpty()) {
        	notificationService.creerNotificationCandidature(savedCandidature);
        }
        analyserCvAsync(savedCandidature);
        
        return savedCandidature;
    }

    @Override
    public Candidature updateCandidature(Long id, Candidature candidature) {
        Candidature existingCandidature = getCandidatureById(id);
        
        // Mise à jour des champs (sauf les fichiers et la date de soumission)
        existingCandidature.setCivilite(candidature.getCivilite());
        existingCandidature.setNomComplet(candidature.getNomComplet());
        existingCandidature.setEmail(candidature.getEmail());
        existingCandidature.setTelephone(candidature.getTelephone());
        existingCandidature.setAdresse(candidature.getAdresse());
        existingCandidature.setCodePostal(candidature.getCodePostal());
        existingCandidature.setVille(candidature.getVille());
        existingCandidature.setMessage(candidature.getMessage());
        
        if (candidature.getFicheDePoste() != null) {
            existingCandidature.setFicheDePoste(candidature.getFicheDePoste());
        }

        return candidatureRepository.save(existingCandidature);
    }

    @Override
    public void deleteCandidature(Long id) {
        if (!candidatureRepository.existsById(id)) {
            throw new RuntimeException("Candidature non trouvée avec l'ID: " + id);
        }
        candidatureRepository.deleteById(id);
    }

    @Override
    public Candidature getCandidatureById(Long id) {
        return candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée avec l'ID: " + id));
    }

    @Override
    public List<Candidature> getAllCandidatures() {
        return candidatureRepository.findAll();
    }

    @Override
    public Candidature updateStatut(Long id, Candidature.StatutCandidature statut) {
        Candidature candidature = getCandidatureById(id);
        candidature.setStatut(statut);
        return candidatureRepository.save(candidature);
    }

    @Override
    public byte[] downloadCV(Long candidatureId) {
        Candidature candidature = getCandidatureById(candidatureId);
        if (candidature.getCv() == null) {
            throw new RuntimeException("Aucun CV trouvé pour cette candidature");
        }
        return FileUtils.decompressFile(candidature.getCv().getFileData());
    }

    @Override
    public byte[] downloadLettreMotivation(Long candidatureId) {
        Candidature candidature = getCandidatureById(candidatureId);
        if (candidature.getLettreMotivation() == null) {
            throw new RuntimeException("Aucune lettre de motivation trouvée pour cette candidature");
        }
        return FileUtils.decompressFile(candidature.getLettreMotivation().getFileData());
    }
    

    @Async
    public void analyserCvAsync(Candidature candidature) {
        candidature.setStatutAnalyseIA("EN_COURS");
        candidatureRepository.save(candidature);
        try {
            // Préparation du prompt
            File fichier = candidature.getCv();
            byte[] data = FileUtils.decompressFile(fichier.getFileData());
            String texteCV = fileService.extractText(data, fichier.getName());

            String description = candidature.getFicheDePoste().getDescription();
            String competences = candidature.getFicheDePoste().getCompetencesRequises().stream()
                    .map(Competence::getNom)
                    .collect(Collectors.joining(", "));

            String prompt = """
                Compare le CV suivant :
                %s

                Avec cette fiche de poste :
                Description : %s
                Compétences : %s

                Donne un score d'adéquation (0 à 100) suivi d'une brève explication.
                """.formatted(texteCV, description, competences);

            IAResponse result = iaService.callAI(prompt);

            candidature.setScoreIA(result.getScore());
            candidature.setStatutAnalyseIA("TERMINEE");
            candidatureRepository.save(candidature);
        } catch (Exception e) {
            candidature.setStatutAnalyseIA("ECHEC");
            candidatureRepository.save(candidature);
        }
    }

}
