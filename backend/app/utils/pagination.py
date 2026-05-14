"""分页工具"""
from typing import TypeVar, Generic, List
from pydantic import BaseModel


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """统一分页响应"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class ApiResponse(BaseModel, Generic[T]):
    """统一API响应"""
    code: int = 0
    message: str = "success"
    data: T | None = None
