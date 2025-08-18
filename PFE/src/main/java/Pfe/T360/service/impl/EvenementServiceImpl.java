package Pfe.T360.service.impl;

import Pfe.T360.dto.EvenementDto;
import Pfe.T360.entity.Evenement;
import Pfe.T360.entity.Invitation;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.repository.EvenementRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.service.EvenementService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EvenementServiceImpl implements EvenementService {

    private final EvenementRepository evenementRepository;
    private final UtilisateurRepository utilisateurRepository;

    public EvenementServiceImpl(EvenementRepository evenementRepository, UtilisateurRepository utilisateurRepository) {
        this.evenementRepository = evenementRepository;
        this.utilisateurRepository = utilisateurRepository;
    }


        public static EvenementDto toDto(Evenement evenement) {
            EvenementDto dto = new EvenementDto();
            dto.setId(evenement.getId());
            dto.setTitre(evenement.getTitre());
            dto.setDescription(evenement.getDescription());
            dto.setDate(evenement.getDate());
            dto.setHeureDebut(evenement.getHeureDebut());
            dto.setHeureFin(evenement.getHeureFin());

            if (evenement.getCreateur() != null) {
                dto.setCreateurId(evenement.getCreateur().getId());
            }

            if (evenement.getRappel() != null) {
                dto.setRappelId(evenement.getRappel().getId());
            }

            if (evenement.getInvitations() != null) {
                dto.setInvitationsIds(
                    evenement.getInvitations().stream()
                        .map(Invitation::getId)
                        .collect(Collectors.toList())
                );
            }

            return dto;
        }

    

    

    @Override
    public Evenement createEvenement(Evenement evenement, Long createurId) {
        Utilisateur createur = utilisateurRepository.findById(createurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        evenement.setCreateur(createur);
        return evenementRepository.save(evenement);
    }
    
    

    @Override
    public List<EvenementDto> getAllEvenements() {
        return evenementRepository.findAll()
                .stream()
                .map(EvenementServiceImpl::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Evenement> getEvenementById(Long id) {
        return evenementRepository.findById(id);
    }

    @Override
    public List<Evenement> getEvenementsByCreateurId(Long createurId) {
        return evenementRepository.findByCreateurId(createurId);
    }

    @Override
    public Evenement updateEvenement(Long id, Evenement updatedEvenement) {
        return evenementRepository.findById(id)
                .map(existing -> {
                    existing.setTitre(updatedEvenement.getTitre());
                    existing.setDescription(updatedEvenement.getDescription());
                    existing.setDate(updatedEvenement.getDate());
                    existing.setHeureDebut(updatedEvenement.getHeureDebut());
                    existing.setHeureFin(updatedEvenement.getHeureFin());
                    return evenementRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));
    }

    @Override
    public void deleteEvenement(Long id) {
        evenementRepository.deleteById(id);
    }
}
