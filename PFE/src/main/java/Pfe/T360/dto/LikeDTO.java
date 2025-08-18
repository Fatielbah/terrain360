package Pfe.T360.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


//LikeDTO.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LikeDTO {
	private Long id;
	private LocalDateTime date;
	private Long postId;
	private Long utilisateurId;
	private String utilisateurNomComplet;


	//LikeRequestDTO.java
	@Data
	public static class LikeRequestDTO {
		@NotNull(message = "L'ID du post est obligatoire")
		private Long postId;

		@NotNull(message = "L'ID de l'utilisateur est obligatoire")
		private Long utilisateurId;
	}
}