package Pfe.T360.service;

import Pfe.T360.entity.Candidature;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CandidatureService {
    Candidature createCandidature(Candidature candidature, MultipartFile cv, MultipartFile lettreMotivation) throws IOException;
    Candidature updateCandidature(Long id, Candidature candidature);
    void deleteCandidature(Long id);
    Candidature getCandidatureById(Long id);
    List<Candidature> getAllCandidatures();
    Candidature updateStatut(Long id, Candidature.StatutCandidature statut);
    byte[] downloadCV(Long candidatureId);
    byte[] downloadLettreMotivation(Long candidatureId);
}
