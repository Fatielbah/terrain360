package Pfe.T360.service.impl;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import Pfe.T360.entity.Candidature;
import Pfe.T360.entity.FichePaie;
import Pfe.T360.entity.FichePrime;
import Pfe.T360.entity.File;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.FichePaieRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.FichePaieService;
import Pfe.T360.util.FileUtils;
import java.util.List;
@Service
public class FichePaieServiceImpl implements FichePaieService {
	 @Autowired
	    private UtilisateurRepository utilisateurRepository;

	    @Autowired
	    private FichePaieRepository fichePaieRepository;
	    

	    public void uploadFichePaie(Long idUtilisateur, MultipartFile fichier) {
	        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
	                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable !"));

	        try {
	            FichePaie fichePaie = FichePaie.builder()
	                    .nomFichier(fichier.getOriginalFilename())
	                    .fichier(FileUtils.compressFile(fichier.getBytes()))
	                    .typeFiche(fichier.getContentType())
	                    .dateEmission(LocalDate.now())
	                    .utilisateur(utilisateur)
	                    .build();

	            fichePaieRepository.save(fichePaie);
	        } catch (IOException e) {
	            throw new RuntimeException("Erreur lors de l'enregistrement de la fiche de prime", e);
	        }
	    }
	    @Override
	    public byte[] downloadFichePaie(Long ficheId) {
	        FichePaie fiche = fichePaieRepository.findById(ficheId)
	                .orElseThrow(() -> new RuntimeException("Fiche de paie introuvable !"));

	        return FileUtils.decompressFile(fiche.getFichier());
	    }

	    public FichePaie getFichePaieById(Long ficheId) {
	        return fichePaieRepository.findById(ficheId)
	                .orElseThrow(() -> new RuntimeException("Fiche de paie introuvable !"));
	    }

	    public List<FichePaie> getFichesPaieByUtilisateur(Long idUtilisateur) {
	        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
	                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable !"));
	        return fichePaieRepository.findByUtilisateurId(utilisateur.getId());
	    }

	    public List<FichePaie> getAllFichesPaie() {
	        return fichePaieRepository.findAll();
	    }
}
