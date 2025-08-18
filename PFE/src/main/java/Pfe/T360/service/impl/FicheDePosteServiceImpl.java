package Pfe.T360.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import Pfe.T360.dto.FicheDePosteDto;
import Pfe.T360.entity.Competence;
import Pfe.T360.entity.FicheDePoste;
import Pfe.T360.entity.Mission;
import Pfe.T360.repository.FicheDePosteRepository;
import Pfe.T360.service.FicheDePosteService;
import lombok.RequiredArgsConstructor;
import Pfe.T360.dto.MissionDto;
import Pfe.T360.dto.CompetenceDto;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class FicheDePosteServiceImpl implements FicheDePosteService {
    private final FicheDePosteRepository ficheRepository;

    @Override
    public FicheDePoste creerFiche(FicheDePosteDto ficheDto) {
        System.out.println("FICHE DTO REÇUE : " + ficheDto);
        ficheDto.setDatePublication(LocalDateTime.now());
        FicheDePoste fiche = mapToEntity(ficheDto);
        return ficheRepository.save(fiche);
    }

    @Override
    public List<FicheDePosteDto> listerFiches() {
        return ficheRepository.findAll().stream()
            .map(this::mapToDto)
            .toList();
    }

    @Override
    public FicheDePosteDto getFicheById(Long id) {
        FicheDePoste fiche = ficheRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Fiche de poste non trouvée avec l'ID : " + id));
        return mapToDto(fiche);
    }

    @Override
    public FicheDePoste updateFiche(Long id, FicheDePosteDto ficheDto) {
        // Vérifier que la fiche existe
        FicheDePoste existingFiche = ficheRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Fiche de poste non trouvée avec l'ID : " + id));
        
        // Mettre à jour les champs de base
        updateBasicFields(existingFiche, ficheDto);
        
        // Mettre à jour les missions (supprimer les anciennes et ajouter les nouvelles)
        updateMissions(existingFiche, ficheDto);
        
        // Mettre à jour les compétences (supprimer les anciennes et ajouter les nouvelles)
        updateCompetences(existingFiche, ficheDto);
        
        // Sauvegarder et retourner
        return ficheRepository.save(existingFiche);
    }

    private void updateBasicFields(FicheDePoste existingFiche, FicheDePosteDto ficheDto) {
        existingFiche.setTitre(ficheDto.getTitre());
        existingFiche.setService(ficheDto.getService());
        existingFiche.setTypeContrat(ficheDto.getTypeContrat());
        existingFiche.setLocalisation(ficheDto.getLocalisation());
        existingFiche.setTypeEmploi(ficheDto.getTypeEmploi());
        existingFiche.setDescription(ficheDto.getDescription());
        existingFiche.setStatus(ficheDto.isStatus());
        existingFiche.setSalaireMin(ficheDto.getSalaireMin());
        existingFiche.setSalaireMax(ficheDto.getSalaireMax());
        existingFiche.setEvolutionProfessionnelle(ficheDto.getEvolutionProfessionnelle());
        existingFiche.setAvantages(ficheDto.getAvantages());
        existingFiche.setDatePublication(ficheDto.getDatePublication());
        
    }

    private void updateMissions(FicheDePoste existingFiche, FicheDePosteDto ficheDto) {
        // Supprimer les anciennes missions
        existingFiche.getMissions().clear();
        
        // Ajouter les nouvelles missions
        if (ficheDto.getMissions() != null && !ficheDto.getMissions().isEmpty()) {
            List<Mission> newMissions = ficheDto.getMissions().stream()
                .map(missionDto -> {
                    Mission mission = new Mission();
                    mission.setDescription(missionDto.getDescription());
                    mission.setFiche(existingFiche);
                    return mission;
                })
                .collect(Collectors.toList());
            existingFiche.getMissions().addAll(newMissions);
        }
    }

    private void updateCompetences(FicheDePoste existingFiche, FicheDePosteDto ficheDto) {
        // Supprimer les anciennes compétences
        existingFiche.getCompetencesRequises().clear();
        
        // Ajouter les nouvelles compétences
        if (ficheDto.getCompetencesRequises() != null && !ficheDto.getCompetencesRequises().isEmpty()) {
            List<Competence> newCompetences = ficheDto.getCompetencesRequises().stream()
                .map(competenceDto -> {
                    Competence competence = new Competence();
                    competence.setNom(competenceDto.getNom());
                    competence.setFiche(existingFiche);
                    return competence;
                })
                .collect(Collectors.toList());
            existingFiche.getCompetencesRequises().addAll(newCompetences);
        }
    }

    private FicheDePosteDto mapToDto(FicheDePoste fiche) {
        FicheDePosteDto dto = new FicheDePosteDto();
        dto.setId(fiche.getId());
        dto.setTitre(fiche.getTitre());
        dto.setService(fiche.getService());
        dto.setTypeContrat(fiche.getTypeContrat());
        dto.setLocalisation(fiche.getLocalisation());
        dto.setDatePublication(fiche.getDatePublication());
       
        dto.setTypeEmploi(fiche.getTypeEmploi());
        dto.setDescription(fiche.getDescription());
        dto.setStatus(fiche.isStatus());
        dto.setSalaireMin(fiche.getSalaireMin());
        dto.setSalaireMax(fiche.getSalaireMax());
        dto.setEvolutionProfessionnelle(fiche.getEvolutionProfessionnelle());
        dto.setAvantages(fiche.getAvantages());
        
        // Mapping Missions avec vérification null
        if (fiche.getMissions() != null) {
            dto.setMissions(fiche.getMissions().stream()
                    .map(m -> {
                        MissionDto mDto = new MissionDto();
                        mDto.setId(m.getId());
                        mDto.setDescription(m.getDescription());
                        return mDto;
                    }).collect(Collectors.toList())
                );
        } else {
            dto.setMissions(new ArrayList<>());
        }

        // Mapping Compétences avec vérification null
        if (fiche.getCompetencesRequises() != null) {
            dto.setCompetencesRequises(fiche.getCompetencesRequises().stream()
                .map(c -> {
                    CompetenceDto cDto = new CompetenceDto();
                    cDto.setId(c.getId());
                    cDto.setNom(c.getNom());
                    return cDto;
                }).collect(Collectors.toList())
            );
        } else {
            dto.setCompetencesRequises(new ArrayList<>());
        }
        
       return dto;
    }

    public FicheDePoste mapToEntity(FicheDePosteDto ficheDto) {
        FicheDePoste fiche = new FicheDePoste();
        
        // Map all the basic fields
        fiche.setTitre(ficheDto.getTitre());
        fiche.setService(ficheDto.getService());
        fiche.setTypeContrat(ficheDto.getTypeContrat());
        fiche.setLocalisation(ficheDto.getLocalisation());
        fiche.setTypeEmploi(ficheDto.getTypeEmploi());
        fiche.setDescription(ficheDto.getDescription());
        fiche.setStatus(ficheDto.isStatus());
        fiche.setSalaireMin(ficheDto.getSalaireMin());
        fiche.setSalaireMax(ficheDto.getSalaireMax());
        fiche.setEvolutionProfessionnelle(ficheDto.getEvolutionProfessionnelle());
        fiche.setAvantages(ficheDto.getAvantages());
        
        // Gestion de datePublication avec vérification null
        if (ficheDto.getDatePublication() != null) {
            fiche.setDatePublication(ficheDto.getDatePublication());
        } else {
            fiche.setDatePublication(LocalDateTime.now());
        }
        
        // Gestion des missions
        if (ficheDto.getMissions() != null && !ficheDto.getMissions().isEmpty()) {
            List<Mission> missions = ficheDto.getMissions().stream()
                .map(missionDto -> {
                    Mission mission = new Mission();
                    mission.setDescription(missionDto.getDescription());
                    mission.setFiche(fiche);
                    return mission;
                })
                .collect(Collectors.toList());
            fiche.setMissions(missions);
        } else {
            fiche.setMissions(new ArrayList<>());
        }
        
        // Gestion des compétences
        if (ficheDto.getCompetencesRequises() != null && !ficheDto.getCompetencesRequises().isEmpty()) {
            List<Competence> competences = ficheDto.getCompetencesRequises().stream()
                .map(competenceDto -> {
                    Competence competence = new Competence();
                    competence.setNom(competenceDto.getNom());
                    competence.setFiche(fiche);
                    return competence;
                })
                .collect(Collectors.toList());
            fiche.setCompetencesRequises(competences);
        } else {
            fiche.setCompetencesRequises(new ArrayList<>());
        }
        
        return fiche;
    }
    
    @Override
    public void deleteFiche(Long id) {
        FicheDePoste fiche = ficheRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Fiche de poste non trouvée"));
        ficheRepository.delete(fiche);
    }
}
