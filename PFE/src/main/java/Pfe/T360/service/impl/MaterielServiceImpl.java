package Pfe.T360.service.impl;

import Pfe.T360.dto.MaterielDTO;
import Pfe.T360.entity.Materiel;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Role;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.Materiel.EtatMateriel;
import Pfe.T360.entity.Materiel.TypeMateriel;
import Pfe.T360.exception.NumeroSerieDejaExistantException;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.repository.NotificationRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.MaterielService;
import Pfe.T360.service.NotificationService;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class MaterielServiceImpl implements MaterielService {

    private final MaterielRepository materielRepository;
    @Autowired
	private UtilisateurRepository utilisateurRepository;
    @Autowired
	private NotificationService notificationService ;
    public MaterielServiceImpl(MaterielRepository materielRepository) {
        this.materielRepository = materielRepository;
    }

    @Override
    public Materiel createMateriel(MaterielDTO materieldto) {
        if (materielRepository.existsByNumeroSerie(materieldto.getNumeroSerie())) {
            throw new NumeroSerieDejaExistantException("Le numéro de série existe déjà.");
        }

        Materiel materiel = new Materiel();
        materiel.setNumeroSerie(materieldto.getNumeroSerie());
        materiel.setMarque(materieldto.getMarque());
        materiel.setModele(materieldto.getModele());
        materiel.setType(materieldto.getType());
        materiel.setDateAchat(materieldto.getDateAchat());
        materiel.setDureeGarantie(materieldto.getDureeGarantie());
        materiel.setEtat(materieldto.getEtat());

        return materielRepository.save(materiel);
    }


    @Override
    public Materiel updateMateriel(Long id, MaterielDTO materiel) {
        Materiel existing = materielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
        
        existing.setNumeroSerie(materiel.getNumeroSerie());
        existing.setMarque(materiel.getMarque());
        existing.setModele(materiel.getModele());
        existing.setType(materiel.getType());
        existing.setDateAchat(materiel.getDateAchat());
        existing.setDureeGarantie(materiel.getDureeGarantie());
        existing.setEtat(materiel.getEtat());
        
        return materielRepository.save(existing);
    }

    @Override
    public void deleteMateriel(Long id) {
        materielRepository.deleteById(id);
    }

    @Override
    public Materiel getMaterielById(Long id) {
        return materielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
    }

    @Override
    public Materiel getMaterielByNumeroSerie(String numeroSerie) {
        return materielRepository.findByNumeroSerie(numeroSerie)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
    }

    @Override
    public List<Materiel> getAllMateriels() {
        return materielRepository.findAll();
    }

    @Override
    public List<Materiel> getMaterielsByType(TypeMateriel type) {
        return materielRepository.findByType(type);
    }

    @Override
    public List<Materiel> getMaterielsByEtat(EtatMateriel etat) {
        return materielRepository.findByEtat(etat);
    }

    @Override
    public List<Materiel> getMaterielsDisponibles() {
        return materielRepository.findMaterielsDisponibles();
    }

    @Override
    public List<Materiel> getMaterielsAffectes() {
        return materielRepository.findMaterielsAffectes();
    }

    @Override
    public List<Materiel> getMaterielsSousGarantie(LocalDate date) {
        return materielRepository.findMaterielsSousGarantie(date);
    }

    @Override
    public Materiel updateEtatMateriel(Long id, EtatMateriel nouvelEtat) {
        Materiel materiel = materielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
        materiel.setEtat(nouvelEtat);
        return materielRepository.save(materiel);
    }
    @Override
    public Map<String, Long> getMaterielStatistics() {
        Map<String, Long> stats = new HashMap<>();
        
        // Nombre total de matériels
        long totalMateriels = materielRepository.count();
        stats.put("totalMateriels", totalMateriels);
        
        // Nombre de matériels en panne
        long materielsEnPanne = materielRepository.countByEtat(EtatMateriel.EN_PANNE);
        stats.put("materielsEnPanne", materielsEnPanne);
        
        // Nombre de matériels en réparation
        long materielsEnReparation = materielRepository.countByEtat(EtatMateriel.EN_REPARATION);
        stats.put("materielsEnReparation", materielsEnReparation);
        
        return stats;
    }
    @Override
    public long countMaterielsAffectesAUser(Long userId) {
        return materielRepository.countByUserWithActiveAffectation(userId);
    }
   
    
    @Scheduled(fixedRate = 60000)
    public void verifierEtNotifierFinDeGarantie() {
        List<Materiel> materiels = materielRepository.findAll();

        for (Materiel materiel : materiels) {
            if (materiel.isGarantieExpiree() && !materiel.isNotificationGarantieEnvoyee()) {

                String titre = "Fin de garantie";
                String message = String.format("Le matériel %s (%s) a dépassé sa période de garantie.",
                    materiel.getMarque(), materiel.getNumeroSerie());

                List<Utilisateur> destinataires = utilisateurRepository.findByRole(Role.INFORMATICIEN);
               

                for (Utilisateur user : destinataires) {
                    notificationService.envoyerNotification(
                        titre,
                        message,
                        Notification.TypeNotification.ALERT_FIN_GARANTIE,
                        materiel.getId(),
                        user,
                        null
                    );
                }

                // Marquer comme notifié
                materiel.setNotificationGarantieEnvoyee(true);
                materielRepository.save(materiel);
            }
        }
    }


}