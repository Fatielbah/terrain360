package Pfe.T360.controller;

import Pfe.T360.entity.Commentaire;
import Pfe.T360.service.CommentaireService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import Pfe.T360.dto.CommentaireDTO;
import Pfe.T360.dto.CommentaireRequestDTO;
@RestController
@RequestMapping("/api/commentaires")
public class CommentaireController {

    private final CommentaireService commentaireService;

    public CommentaireController(CommentaireService commentaireService) {
        this.commentaireService = commentaireService;
    }

    @PostMapping
    public ResponseEntity<CommentaireDTO> create(@Valid @RequestBody CommentaireRequestDTO commentaireRequest) {
        CommentaireDTO created = commentaireService.createCommentaire(commentaireRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentaireDTO>> getByPost(@PathVariable Long postId) {
        List<CommentaireDTO> commentaires = commentaireService.getCommentairesByPost(postId);
        return ResponseEntity.ok(commentaires);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentaireDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CommentaireRequestDTO commentaireRequest) {
        CommentaireDTO updated = commentaireService.updateCommentaire(id, commentaireRequest);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentaireService.deleteCommentaire(id);
        return ResponseEntity.noContent().build();
    }
}
