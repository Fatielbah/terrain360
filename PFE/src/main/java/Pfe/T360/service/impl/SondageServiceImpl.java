package Pfe.T360.service.impl;

import Pfe.T360.dto.OptionUpdateDTO;
import Pfe.T360.dto.SondageDTO;
import Pfe.T360.dto.SondageUpdateDTO;
import Pfe.T360.entity.Notification;
import Pfe.T360.entity.Option;
import Pfe.T360.entity.Sondage;
import Pfe.T360.entity.Utilisateur;
import Pfe.T360.entity.Vote;
import Pfe.T360.repository.SondageRepository;
import Pfe.T360.repository.UtilisateurRepository;
import Pfe.T360.repository.VoteRepository;
import Pfe.T360.repository.OptionRepository;
import Pfe.T360.service.NotificationService;
import Pfe.T360.service.SondageService;
import jakarta.transaction.Transactional;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SondageServiceImpl implements SondageService {

    private final SondageRepository sondageRepository;
    private final OptionRepository optionRepository;
    private final VoteRepository voteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;

    public SondageServiceImpl(SondageRepository sondageRepository
    		,OptionRepository optionRepository,VoteRepository voteRepository
    		,UtilisateurRepository utilisateurRepositor,NotificationService notificationService) {
        this.sondageRepository = sondageRepository;
        this.optionRepository =optionRepository;
        this.voteRepository =voteRepository;
        this.utilisateurRepository= utilisateurRepositor;
        this.notificationService=notificationService;
        
    }
    @Override
    public Sondage createSondage(Sondage sondage) {
        sondage.setDate(LocalDateTime.now());

        if (sondage.getAuteur() != null && sondage.getAuteur().getId() != null) {
            Utilisateur auteur = utilisateurRepository
                .findById(sondage.getAuteur().getId())
                .orElseThrow(() -> new RuntimeException("Auteur introuvable"));
            sondage.setAuteur(auteur);
        } else {
            throw new RuntimeException("Auteur invalide ou manquant");
        }
        
        if (sondage.getOptions() != null) {
            for (Option option : sondage.getOptions()) {
                option.setSondage(sondage);
            }
        }

        Sondage savedSondage = sondageRepository.save(sondage);
        
        // Send notifications after saving
        List<Utilisateur> recipients = utilisateurRepository.findAll()
                .stream()
                .filter(u -> !u.getId().equals(sondage.getAuteur().getId()))
                .collect(Collectors.toList());
        
        for (Utilisateur recipient : recipients) {
            notificationService.envoyerNotification(
                "Nouveau sondage de " + sondage.getAuteur().getNom() + " " + sondage.getAuteur().getPrenom(),
                "Un nouveau sondage a été publié par " + sondage.getAuteur().getNom() + " " + sondage.getAuteur().getPrenom(),
                Notification.TypeNotification.NOUVEAU_SONDAGE,
                savedSondage.getId(),
                recipient,
                sondage.getAuteur()
            );
        }
        
        return savedSondage;
    }

    @Override
    public List<SondageDTO> getAllSondages() {
        List<Sondage> sondages = sondageRepository.findAll();

        return sondages.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private SondageDTO convertToDTO(Sondage sondage) {
        SondageDTO dto = new SondageDTO();
        dto.setId(sondage.getId());
        dto.setQuestion(sondage.getQuestion());
        dto.setDate(sondage.getDate());
        dto.setAuteurId(sondage.getAuteur() != null ? sondage.getAuteur().getId() : 0);

        if (sondage.getOptions() != null) {
            List<SondageDTO.OptionDTO> optionsDTO = sondage.getOptions().stream()
                .map(opt -> {
                    SondageDTO.OptionDTO optionDTO = new SondageDTO.OptionDTO();
                    optionDTO.setId(opt.getId());
                    optionDTO.setTexte(opt.getTexte());

                    // mapping des votes détaillés
                    if (opt.getVotes() != null) {
                        List<SondageDTO.VoteDTO> voteDTOs = opt.getVotes().stream()
                            .map(vote -> {
                                SondageDTO.VoteDTO voteDTO = new SondageDTO.VoteDTO();
                                voteDTO.setId(vote.getId());
                                voteDTO.setUtilisateurId(vote.getUtilisateur().getId());
                                voteDTO.setUtilisateurNom(vote.getUtilisateur().getNom()); // ou getName selon ta classe Utilisateur
                                return voteDTO;
                            })
                            .collect(Collectors.toList());

                        optionDTO.setVotesDetails(voteDTOs);
                    }

                    return optionDTO;
                })
                .collect(Collectors.toList());

            dto.setOptions(optionsDTO);
        }

        return dto;
    }


    @Override
    public Sondage getSondageById(Long id) {
        return sondageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sondage non trouvé"));
    }

    @Override
    @Transactional
    public SondageDTO updateSondage(Long id, SondageUpdateDTO sondageUpdateDTO) {
        // 1. Récupération du sondage existant
        Sondage existingSondage = sondageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sondage non trouvé avec l'ID: " + id));

        // 2. Mise à jour des champs de base
        if (sondageUpdateDTO.getQuestion() != null) {
            existingSondage.setQuestion(sondageUpdateDTO.getQuestion());
        }

        // 3. Mise à jour des options
        if (sondageUpdateDTO.getOptions() != null) {
            updateSondageOptions(existingSondage, sondageUpdateDTO.getOptions());
        }

        // 4. Sauvegarde et conversion en DTO
        Sondage updatedSondage = sondageRepository.save(existingSondage);
        return convertToSondageDTO(updatedSondage);
    }

    private void updateSondageOptions(Sondage sondage, List<OptionUpdateDTO> newOptions) {
        // Créer une map des options existantes pour un accès rapide
        Map<Long, Option> existingOptionsMap = sondage.getOptions().stream()
                .collect(Collectors.toMap(Option::getId, Function.identity()));

        // Liste pour les options à supprimer
        List<Option> optionsToRemove = new ArrayList<>(sondage.getOptions());

        // Traiter chaque option du DTO
        for (OptionUpdateDTO newOptionDTO : newOptions) {
            if (newOptionDTO.getId() != null) {
                // Option existante - mise à jour
                Option existingOption = existingOptionsMap.get(newOptionDTO.getId());
                if (existingOption != null) {
                    existingOption.setTexte(newOptionDTO.getTexte());
                    optionsToRemove.remove(existingOption);
                }
            } else {
                // Nouvelle option - création
                Option newOption = new Option();
                newOption.setTexte(newOptionDTO.getTexte());
                newOption.setSondage(sondage);
                sondage.getOptions().add(newOption);
            }
        }

        // Suppression des options obsolètes
        sondage.getOptions().removeAll(optionsToRemove);
        optionRepository.deleteAll(optionsToRemove);
    }

    private SondageDTO convertToSondageDTO(Sondage sondage) {
        SondageDTO dto = new SondageDTO();
        dto.setId(sondage.getId());
        dto.setQuestion(sondage.getQuestion());
        dto.setDate(sondage.getDate());
        dto.setAuteurId(sondage.getAuteur().getId());
        
        // Conversion des options
        if (sondage.getOptions() != null) {
            dto.setOptions(sondage.getOptions().stream()
                    .map(this::convertToOptionDTO)
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }

    private SondageDTO.OptionDTO convertToOptionDTO(Option option) {
        SondageDTO.OptionDTO optionDTO = new SondageDTO.OptionDTO();
        optionDTO.setId(option.getId());
        optionDTO.setTexte(option.getTexte());
        
        // Conversion des votes si nécessaire
        if (option.getVotes() != null) {
            optionDTO.setVotesDetails(option.getVotes().stream()
                    .map(this::convertToVoteDTO)
                    .collect(Collectors.toList()));
        }
        
        return optionDTO;
    }

    private SondageDTO.VoteDTO convertToVoteDTO(Vote vote) {
        SondageDTO.VoteDTO voteDTO = new SondageDTO.VoteDTO();
        voteDTO.setId(vote.getId());
        voteDTO.setUtilisateurId(vote.getUtilisateur().getId());
        voteDTO.setUtilisateurNom(vote.getUtilisateur().getNom());
        return voteDTO;
    }

   
    @Override
    public void deleteSondage(Long id) {
        sondageRepository.deleteById(id);
    }
    
    @Override
    public Vote voterOption(Long optionId, Long utilisateurId) {
        // Récupérer l'option et vérifier son existence
        Option newOption = optionRepository.findById(optionId)
            .orElseThrow(() -> new RuntimeException("Option non trouvée"));
        
        // Récupérer l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        // Récupérer le sondage associé à l'option
        Sondage sondage = newOption.getSondage();
        
        // Vérifier si l'utilisateur a déjà voté dans ce sondage
        Optional<Vote> voteExist = voteRepository.findByUtilisateurAndSondage(utilisateur, sondage);
        
        if (voteExist.isPresent()) {
            // Cas 1: L'utilisateur vote pour la même option => annulation
            if (voteExist.get().getOption().getId().equals(optionId)) {
                voteRepository.delete(voteExist.get());
                return null; // ou throw une exception spécifique
            }
            // Cas 2: L'utilisateur change d'option => modification
            else {
                Vote existingVote = voteExist.get();
                existingVote.setOption(newOption);
                return voteRepository.save(existingVote);
            }
        }
        // Cas 3: Nouveau vote
        else {
            Vote newVote = new Vote();
            newVote.setOption(newOption);
            newVote.setUtilisateur(utilisateur);
            newVote.setSondage(sondage);
            return voteRepository.save(newVote);
        }
    }

}
