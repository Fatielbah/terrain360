package Pfe.T360.dto;

import Pfe.T360.entity.Candidature;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CandidatureResponseDto {
    private Long id;
    private String civilite;
    private String nomComplet;
    private String email;
    private String telephone;
    private String adresse;
    private String codePostal;
    private String ville;
    private String message;
    private String cvFileName;
    private String lettreMotivatioFileName;
    private Candidature.StatutCandidature statut;
    private LocalDateTime dateSoumission;
    private Long ficheDePosteId;

    public static CandidatureResponseDto fromEntity(Candidature candidature) {
        CandidatureResponseDto dto = new CandidatureResponseDto();
        dto.setId(candidature.getId());
        dto.setCivilite(candidature.getCivilite());
        dto.setNomComplet(candidature.getNomComplet());
        dto.setEmail(candidature.getEmail());
        dto.setTelephone(candidature.getTelephone());
        dto.setAdresse(candidature.getAdresse());
        dto.setCodePostal(candidature.getCodePostal());
        dto.setVille(candidature.getVille());
        dto.setMessage(candidature.getMessage());
        dto.setStatut(candidature.getStatut());
        dto.setDateSoumission(candidature.getDateSoumission());
        
        if (candidature.getCv() != null) {
            dto.setCvFileName(candidature.getCv().getName());
        }
        
        if (candidature.getLettreMotivation() != null) {
            dto.setLettreMotivatioFileName(candidature.getLettreMotivation().getName());
        }
        
        if (candidature.getFicheDePoste() != null) {
            dto.setFicheDePosteId(candidature.getFicheDePoste().getId());
        }
        
        return dto;
    }
}
