package Pfe.T360.service.impl;

import Pfe.T360.dto.AffectationDTO;
import Pfe.T360.dto.NotificationDTO;
import Pfe.T360.entity.*;
import Pfe.T360.entity.Affectation.StatutAffectation;
import Pfe.T360.repository.AffectationRepository;
import Pfe.T360.repository.HistoriqueAffectationRepository;
import Pfe.T360.repository.MaterielRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.AffectationService;
import Pfe.T360.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AffectationServiceImpl implements AffectationService {

	private final AffectationRepository affectationRepository;
	private final HistoriqueAffectationRepository historiqueRepository;
	private final MaterielRepository materielRepository;
	private final UtilisateurRepository utilisateurRepository;
	private final NotificationService notificationService;

	public AffectationServiceImpl(AffectationRepository affectationRepository,
			HistoriqueAffectationRepository historiqueRepository,
			MaterielRepository materielRepository,
			UtilisateurRepository utilisateurRepository,
			NotificationService notificationService) {
		this.affectationRepository = affectationRepository;
		this.historiqueRepository = historiqueRepository;
		this.materielRepository = materielRepository;
		this.utilisateurRepository = utilisateurRepository;
		this.notificationService= notificationService;
		
	}
	private AffectationDTO convertToDTO(Affectation affectation) {
		return new AffectationDTO(
				affectation.getId(),
				affectation.getMateriel().getId(),
				affectation.getUtilisateur().getId(),
				affectation.getTechnicien() != null ? affectation.getTechnicien().getId() : null,
				affectation.getDateDebut(),
				affectation.getDateFin(),
				affectation.getMotif(),
				affectation.getStatut()
				
				);
	}

	@Override
	public Affectation createAffectation(Materiel materielDTO, Utilisateur utilisateur, 
			LocalDate dateDebut, String motif,Utilisateur technicien) {

		Materiel materiel = materielRepository.findById(materielDTO.getId())
				.orElseThrow(() -> new IllegalArgumentException("Matériel non trouvé"));

		// Check material state
		if (materiel.getEtat() != Materiel.EtatMateriel.FONCTIONNEL) {
			throw new IllegalStateException("Le matériel doit être en état fonctionnel pour être affecté");
		}

		// Check for existing active affectation
		boolean hasActiveAffectation = affectationRepository
				.existsByMaterielAndStatut(materiel, Affectation.StatutAffectation.ACTIVE);

		if (hasActiveAffectation) {
			throw new IllegalStateException("Ce matériel est déjà affecté à un utilisateur");
		}

		// Create new affectation
		Affectation affectation = new Affectation();
		affectation.setMateriel(materiel);
		affectation.setUtilisateur(utilisateur);
		affectation.setDateDebut(dateDebut);
		affectation.setMotif(motif);
		affectation.setTechnicien(technicien);
		affectation.setStatut(Affectation.StatutAffectation.ACTIVE);
		affectation = affectationRepository.save(affectation);

		// Create history entry
		HistoriqueAffectation historique = new HistoriqueAffectation();
		historique.setMateriel(materiel);
		historique.setUtilisateur(utilisateur);
		historique.setDateDebut(dateDebut);
		historique.setStatut(HistoriqueAffectation.StatutAffectation.ACTIVE);
		historique.setAffectation(affectation);
		historiqueRepository.save(historique);
		// ✅ Création et envoi de la notification
		NotificationDTO notification = NotificationDTO.builder()
				.titre("Matériel affecté")
				.message(String.format("Le matériel %s (%s) vous a été affecté le %s.",
						materiel.getNumeroSerie(),
						materiel.getMarque(),
						dateDebut.toString()))
				.type(Notification.TypeNotification.AFFECTATION.name())
				.materiel(materiel.getId())
				.dateCreation(LocalDateTime.now())
				.lue(false)
				.destinataireId(utilisateur.getId())
				.expediteurId(technicien.getId())
				.build();

		notificationService.createNotification(notification);

		return affectation;
	}
	@Override
	public void terminateAffectation(Long affectationId, LocalDate dateFin, String commentaire,Utilisateur technicien) {
		Affectation affectation = affectationRepository.findById(affectationId)
				.orElseThrow(() -> new RuntimeException("Affectation non trouvée"));

		affectation.setDateFin(dateFin);
		affectation.setStatut(Affectation.StatutAffectation.TERMINATED);
		affectation.setTechnicien(technicien);
		affectationRepository.save(affectation);

		// Mettre à jour l'historique
		HistoriqueAffectation historique = historiqueRepository.findByAffectation(affectation)
				.orElseThrow(() -> new RuntimeException("Entrée historique non trouvée"));
		historique.setDateFin(dateFin);
		historique.setStatut(HistoriqueAffectation.StatutAffectation.TERMINEE);
		historique.setCommentaire(commentaire);
		
		historiqueRepository.save(historique);

		// ✅ Création de notification de fin d'affectation
		Materiel materiel = affectation.getMateriel();
		Utilisateur utilisateur = affectation.getUtilisateur(); // Récupéré depuis l'affectation
		LocalDate dateDebut = affectation.getDateDebut();

		NotificationDTO notification = NotificationDTO.builder()
				.titre("Fin d'affectation")
				.message(String.format("Le matériel %s (%s) affecté depuis le %s a été libéré le %s.",
						materiel.getNumeroSerie(),
						materiel.getMarque(),
						dateDebut.toString(),
						dateFin.toString()))
				.type(Notification.TypeNotification.AFFECTATION_TERMINEE.name()) // <-- à définir dans ton enum si besoin
				.materiel(materiel.getId())
				.dateCreation(LocalDateTime.now())
				.lue(false)
				.destinataireId(utilisateur.getId())
				.expediteurId(technicien.getId())
				.build();

		notificationService.createNotification(notification);
	}


	@Override
	public List<AffectationDTO> getAffectationsActives() {
		List<Affectation> affectations = affectationRepository.findByDateFinIsNull();

		return affectations.stream()
				.map(this::convertToDTO)
				.collect(Collectors.toList());
	}

	@Override
	public List<AffectationDTO> getAffectationsByUtilisateur(Long utilisateurId) {
		Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
				.orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

		List<Affectation> affectations = affectationRepository.findByUtilisateur(utilisateur);

		return affectations.stream().map(a -> {
			AffectationDTO dto = new AffectationDTO();
			dto.setId(a.getId());
			dto.setUtilisateurId(a.getUtilisateur().getId());
			dto.setMaterielId(a.getMateriel().getId());
			dto.setDateDebut(a.getDateDebut());
			dto.setDateFin(a.getDateFin());
			dto.setMotif(a.getMotif());
			dto.setStatut(a.getStatut());
			return dto;
		}).collect(Collectors.toList());
	}


	@Override
	public List<Affectation> getAffectationsByMateriel(Long materielId) {
		Materiel materiel = materielRepository.findById(materielId)
				.orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
		return affectationRepository.findByMateriel(materiel);
	}

	@Override
	public Affectation getCurrentAffectationForMateriel(Long materielId) {
		Materiel materiel = materielRepository.findById(materielId)
				.orElseThrow(() -> new RuntimeException("Matériel non trouvé"));
		return affectationRepository.findByMaterielAndDateFinIsNull(materiel)
				.orElse(null);
	}
	@Override
	public List<Affectation> getAffectationsBetweenDates(LocalDate startDate, LocalDate endDate) {
		return null;
	}
	@Override
	public Map<String, Long> getMaterielCountByEtatForUser(Long userId) {
		List<Object[]> results = affectationRepository.countMaterielsByEtatForUser(userId);

		Map<String, Long> countMap = new HashMap<>();
		for (Object[] result : results) {
			String etat = result[0].toString(); // Exemple: "FONCTIONNEL"
			Long count = (Long) result[1];
			countMap.put(etat, count);
		}
		return countMap;
	}
	@Override
	public List<Materiel> getMaterielsByUser(Long idUser) {
		return affectationRepository.findMaterielsActifsParUtilisateur(idUser);
	}


}