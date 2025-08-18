package Pfe.T360.service;

import Pfe.T360.dto.HistoriqueAffectationDTO;
import Pfe.T360.entity.HistoriqueAffectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Utilisateur;
import java.time.LocalDate;
import java.util.List;

public interface HistoriqueAffectationService {
    List<HistoriqueAffectation> getHistoriqueComplet();
    List<HistoriqueAffectation> getHistoriqueByUtilisateur(Long utilisateurId);
    List<HistoriqueAffectation> getAffectationsActives();
    List<HistoriqueAffectationDTO> getHistoriqueByMateriel(Long materielId);
}