package Pfe.T360.service;

import Pfe.T360.dto.LikeDTO.LikeRequestDTO;
import Pfe.T360.entity.Like;
import Pfe.T360.dto.LikeDTO;

import java.util.List;

public interface LikeService {
	LikeDTO addLike(LikeRequestDTO likeRequest);
    public void removeLike(LikeRequestDTO likeRequest);
    public List<LikeDTO> getLikesByPost(Long postId);
}

