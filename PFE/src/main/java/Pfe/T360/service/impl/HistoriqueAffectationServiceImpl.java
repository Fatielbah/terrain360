package Pfe.T360.service.impl;

import Pfe.T360.dto.HistoriqueAffectationDTO;
import Pfe.T360.entity.*;
import Pfe.T360.repository.HistoriqueAffectationRepository;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.HistoriqueAffectationService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HistoriqueAffectationServiceImpl implements HistoriqueAffectationService {

    private final HistoriqueAffectationRepository historiqueRepository;
    private final MaterielRepository materielRepository;
    private final UtilisateurRepository utilisateurRepository;

    public HistoriqueAffectationServiceImpl(HistoriqueAffectationRepository historiqueRepository,
                                          MaterielRepository materielRepository,
                                          UtilisateurRepository utilisateurRepository) {
        this.historiqueRepository = historiqueRepository;
        this.materielRepository = materielRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public List<HistoriqueAffectation> getHistoriqueComplet() {
        return historiqueRepository.findAllByOrderByDateDebutDesc();
    }

    
    
    @Override
    public List<HistoriqueAffectation> getHistoriqueByUtilisateur(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return historiqueRepository.findByUtilisateurOrderByDateDebutDesc(utilisateur);
    }

   

    @Override
    public List<HistoriqueAffectation> getAffectationsActives() {
        return historiqueRepository.findByDateFinIsNull();
    }
    

	
    @Override
    public List<HistoriqueAffectationDTO> getHistoriqueByMateriel(Long materielId) {
        try {
            // Vérification de l'existence du matériel
            if (!materielRepository.existsById(materielId)) {
                throw new EntityNotFoundException("Matériel non trouvé avec l'ID: " + materielId);
            }
            
            List<HistoriqueAffectation> historiques = historiqueRepository.findByMaterielIdOrderByDateDebutDesc(materielId);
            return historiques.stream().map(h -> {
                HistoriqueAffectationDTO dto = new HistoriqueAffectationDTO();
                dto.setId(h.getId());
                dto.setMaterielId(h.getMateriel().getId());
                dto.setUtilisateurId(h.getUtilisateur().getId());
                dto.setDateDebut(h.getDateDebut());
                dto.setDateFin(h.getDateFin());
                dto.setStatut(h.getStatut().name());
                dto.setCommentaire(h.getCommentaire());
                dto.setCreatedAt(h.getCreatedAt());
                return dto;
            }).collect(Collectors.toList());
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération de l'historique", e);
        }
    }

    
    
}