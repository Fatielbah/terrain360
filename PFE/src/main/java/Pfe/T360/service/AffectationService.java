package Pfe.T360.service;

import Pfe.T360.dto.AffectationDTO;
import Pfe.T360.entity.Affectation;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Utilisateur;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AffectationService {
    Affectation createAffectation(Materiel materiel, Utilisateur utilisateur, LocalDate dateDebut, String motif,Utilisateur technicien);
    void terminateAffectation(Long affectationId, LocalDate dateFin, String commentaire,Utilisateur technicien);
    List<AffectationDTO> getAffectationsActives();
    List<Affectation> getAffectationsByMateriel(Long materielId);
    Affectation getCurrentAffectationForMateriel(Long materielId);
    List<Affectation> getAffectationsBetweenDates(LocalDate startDate, LocalDate endDate);
    Map<String, Long> getMaterielCountByEtatForUser(Long userId) ;
    List<Materiel> getMaterielsByUser(Long idUser);
    List<AffectationDTO> getAffectationsByUtilisateur(Long utilisateurId);
}