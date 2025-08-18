package Pfe.T360.service;


import Pfe.T360.dto.CommentaireDTO;
import Pfe.T360.dto.CommentaireRequestDTO;
import Pfe.T360.entity.Commentaire;

import java.util.List;

public interface CommentaireService {
	CommentaireDTO createCommentaire(CommentaireRequestDTO commentaireRequest);
	List<CommentaireDTO> getCommentairesByPost(Long postId);
	CommentaireDTO updateCommentaire(Long id, CommentaireRequestDTO commentaireRequest);
	void deleteCommentaire(Long id);
}
