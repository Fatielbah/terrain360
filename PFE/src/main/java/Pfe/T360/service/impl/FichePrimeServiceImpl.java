package Pfe.T360.service.impl;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import Pfe.T360.entity.FichePrime;
import Pfe.T360.entity.FichePrime;

import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.FichePrimeRepository;

import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.util.FileUtils;
@Service
public class FichePrimeServiceImpl {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private FichePrimeRepository fichePrimeRepository;

    public void uploadFichePrime(Long idUtilisateur, MultipartFile fichier) {
        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable !"));

        try {
            FichePrime fichePrime = FichePrime.builder()
                    .nomFichier(fichier.getOriginalFilename())
                    .fichier(FileUtils.compressFile(fichier.getBytes()))
                    .typeFiche(fichier.getContentType())
                    .dateAttribution(LocalDate.now())
                    .utilisateur(utilisateur)
                    .build();

            fichePrimeRepository.save(fichePrime);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement de la fiche de prime", e);
        }
    }
    public FichePrime getFichePrimeById(Long ficheId) {
        return fichePrimeRepository.findById(ficheId)
                .orElseThrow(() -> new RuntimeException("Fiche de prime introuvable !"));
    }

    public byte[] downloadFichePrime(Long ficheId) {
        FichePrime fiche = fichePrimeRepository.findById(ficheId)
                .orElseThrow(() -> new RuntimeException("Fiche de Prime introuvable !"));

        return FileUtils.decompressFile(fiche.getFichier());
    }
    public List<FichePrime> getFichesPrimeByUtilisateur(Long idUtilisateur) {
        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable !"));
        return fichePrimeRepository.findByUtilisateurId(utilisateur.getId());
    }

    public List<FichePrime> getAllFichesPrime() {
        return fichePrimeRepository.findAll();
    }
}
