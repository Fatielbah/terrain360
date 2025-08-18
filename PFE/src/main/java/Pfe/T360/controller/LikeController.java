package Pfe.T360.controller;

import Pfe.T360.entity.Like;
import Pfe.T360.service.LikeService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import Pfe.T360.dto.LikeDTO;
import Pfe.T360.dto.LikeDTO.LikeRequestDTO;
import java.util.List;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping
    public ResponseEntity<LikeDTO> likePost(@Valid @RequestBody LikeRequestDTO likeRequest) {
        LikeDTO likeDTO = likeService.addLike(likeRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(likeDTO);
    }

    @DeleteMapping
    public ResponseEntity<Void> unlikePost(@Valid @RequestBody LikeRequestDTO likeRequest) {
        likeService.removeLike(likeRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<LikeDTO>> getLikesByPost(@PathVariable Long postId) {
        List<LikeDTO> likes = likeService.getLikesByPost(postId);
        return ResponseEntity.ok(likes);
    }
}
