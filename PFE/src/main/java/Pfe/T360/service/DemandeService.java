package Pfe.T360.service;
import Pfe.T360.entity.DemandeAbsence;
import Pfe.T360.entity.DemandeConge;
import Pfe.T360.entity.Demande;
import Pfe.T360.entity.Demande.StatutDemande;
import Pfe.T360.service.impl.DemandeServiceImpl.ActionRH;
import Pfe.T360.entity.DemandeDocument;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;
public interface DemandeService {
    DemandeConge createDemandeConge(DemandeConge demande, Long userId,MultipartFile justificationFile);
    DemandeAbsence createDemandeAbsence(DemandeAbsence demande, Long userId, MultipartFile justificationFile);
    DemandeDocument createDemandeDocument(DemandeDocument demande, Long userId);
    List<Demande> getDemandesByUser(Long userId);
    List<Demande> getDemandesByStatus(StatutDemande statut);
    Demande getDemandeDetails(Long demandeId);
    void cancelDemande(Long demandeId, Long userId);
    void deleteDemande(Long demandeId, Long userId);
    public byte[] downloadJustification(Long demandeId);
    void traiterDemandeDirection(Long demandeId, Long validateurId, String commentaire, boolean estValidee);
    void traiterDemandeRH(Long demandeId, Long validateurId, String commentaire, ActionRH action);
}